const crypto = require("crypto")
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async")
const User = require("../models/User")
const sendEmail = require("../utils/sendEmail");

exports.getMe = asyncHandler(async (req, res, next) => {
    const user = (await User.findById(req.user.id)) || null

    return res.status(200).json({
        success: true,
        data: user
    })
})

exports.logout = asyncHandler(async (req, res, next) => {
    res.cookie('token', 'node', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })

    return res.status(200).json({
        success: true,
        data: {},
    })
})


exports.forgotPassword = asyncHandler(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
        return next(new ErrorResponse("There is not user with that email", 404))
    }

    // get Reset Token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/auth/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message,
        });
        return res.status(200).json({
            success: true,
            data: `Email sent to ${user.email}`
        })
    } catch (err) {
        console.log(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({
            validateBeforeSave: false,
        });

        return next(new ErrorResponse('Email could not be send', 500));
    }

})


//update Details

exports.updateDetails = asyncHandler(async (req, res, next) => {
    const fieldToUpdate = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldToUpdate, {
        new: true,
        runValidators: true,
    })

    return res.status(200).json({
        success: true,
        data: user,
    })
});

exports.updatePassword = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('Password is incorrect', 401));
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
});

exports.resetpassword = asyncHandler(async (req, res, next) => {
    //get hashed toktn
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: {
            $gt: Date.now()
        }
    })

    if (!user) {
        return next(new ErrorResponse('Invalid token', 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
})

exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body
    const user = await User.create({
        name, email, password, role
    })
    sendTokenResponse(user, 200, res);
})

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);
});


const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    const options = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIR * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    return res.status(statusCode).cookie('token', token, options).json({
        success: true,
        token,
    });
};
