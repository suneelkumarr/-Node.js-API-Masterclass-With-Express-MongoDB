const path = require("path")
const asyncHandler = require("../middleware/async")
const ErrorResponse = require("../utils/errorResponse")
const Bootcamp = require("../models/Bootcamp")
const geocoder = require("../utils/geocoder")



exports.getBootcamps = asyncHandler(async (req, res, next) => {
    return res.status(200).json(res.advancedResults)
})

exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)
    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        );
    }

    return res.status(200).json({
        success: true,
        data: bootcamp
    })
})


exports.createBootcamp = asyncHandler(async (req, res, next) => {
    req.body.user = req.user.id;

    const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id });

    if (publishedBootcamp && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(
                `The user with ID ${req.user.id} has already published a bootcamp`,
                400
            )
        );
    }

    const bootcamp = await Bootcamp.create(req.body)

    return res.status(200).json({
        success: true,
        data: bootcamp
    })
})


exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    let bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        )
    }

    //male sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401)
        )
    }

    bootcamp = await Bootcamp.findOneAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    return res.status(200).json({
        success: true,
        data: bootcamp
    })
})

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id)

    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404
            )
        )
    }

    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.params.id} is not authorized to delete this bootcamp`, 401)
        )
    }

    bootcamp.remove()

    return res.status(200).json({
        success: true,
        data: {}
    })
})

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const { zipcode, distance } = req.params
    const loc = await geocoder.geocode(zipcode)
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    //calc radius using radians
    // Divide dist by radius of Earth
    // Earth Radius = 3,963mi/ 6378

    const radius = distance / 3963;
    const bootcamps = await Bootcamp.find({
        location: {
            $geoWithin: {
                $centerSphere: [[lng, lat], radius]
            }
        }
    })

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
})


exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);
    if (!bootcamp) {
        return next(
            new ErrorResponse(`Bootcamp not found with id of ${req.params.id}`, 404)
        )
    }

    // make sure user is bootcamp owner
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.params.id} is not authorized to update this bootcamp`, 401)
        )
    }

    if (!req.files) {
        return next(new ErrorResponse(`Please upload a file`, 404))
    }

    const file = req.files.file;
    // make sure the image is a photo
    if (!file.mimetype.startsWith('image')) {
        return next(new ErrorResponse(`Please upload an image file`, 404))
    }


    //check filesize 
    if (file.size > process.env.MAX_FILE_UPLOAD) {
        return next(
            new ErrorResponse(`Please upload an image less than ${process.env.MAX_FILE_UPLOAD}`, 404)
        )
    }

    // create custom filename

    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

    file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
        if (err) {
            console.log(err);
            return next(new ErrorResponse(`Problem with file upload`, 500))
        }

        await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });

        return res.status(200).json({
            success: true,
            data: file.name
        })
    })
})


