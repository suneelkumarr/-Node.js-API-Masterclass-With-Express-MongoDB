const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp")

exports.getCourses = asyncHandler(async (req, res, next) => {
    if (req.params.BootcampId) {
        const courses = await Course.find({ bootcamp: req.params.bootcampId });

        return res.status(200).json({
            success: true,
            count: courses.length,
            data: courses,
        })
    } else {
        res.status(200).json(res.advancedResults)
    }
})

exports.getCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id).populate({
        path: 'bootcamp',
        select: 'name description'
    })

    if (!course) {
        return next(
            new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
        )
    }

    return res.status(200).json({
        success: true,
        data: course
    })
})


exports.addCourse = asyncHandler(async (req, res, next) => {
    req.body.bootcamp = req.params.bootcampId
    req.body.user = req.user.id;

    const bootcmap = await Bootcamp.findById(req.params.bootcampId)

    if (!bootcmap) {
        return next(
            new ErrorResponse(`No bootcamp with the id of ${req.params.bootcampId}`, 404)
        )
    }


    // make sure user is bootcamp owner

    if (bootcmap.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to add a course to bootcamp ${bootcmap._id}`, 401)
        )
    }


    const course = await Course.create(req.body);

    return res.status(200).json({
        success: true,
        data: course
    })

})


exports.updateCourse = asyncHandler(async (req, res, next) => {
    let course = await Course.findById(req.params.id)
    if (!course) {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to update course ${course._id}`, 404)
        )
    }


    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    })

    return res.status(200).json({
        success: true,
        data: course
    })
})


exports.deleteCourse = asyncHandler(async (req, res, next) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        return next(
            new ErrorResponse(`No course with the id of ${req.params.id}`, 404)
        )
    }

    // make sure user is course owner

    if (course.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return next(
            new ErrorResponse(`User ${req.user.id} is not authorized to delete course ${course._id}`, 401)
        )
    }

    await course.remove();

    return res.status(200).json({
        success: true,
        data: {

        }
    });
});


