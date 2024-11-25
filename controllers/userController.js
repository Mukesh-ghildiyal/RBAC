const User = require('../models/userModel');

const { validationResult } = require('express-validator');

const bcrypt = require('bcrypt');
const randomstring = require('randomstring');

const { sendMail } = require('../helpers/mailer');



// Store OTPs temporarily (you can replace this with Redis for better scalability)
const otpStore = new Map();

/**
 * Send OTP for 2FA
 */
const send2FAOTP = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                msg: "User not found!",
            });
        }

        // Generate OTP
        const otp = randomstring.generate({
            length: 6,
            charset: 'numeric',
        });

        // Store OTP in memory with a 10-minute expiry
        otpStore.set(email, {
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
        });

        // Send OTP email
        const content = `
            <p>Hello ${user.name},</p>
            <p>Your OTP for login is:</p>
            <h3 style="font-size: 24px; color: #007BFF; text-align: center;">${otp}</h3>
            <p>This OTP is valid for the next 10 minutes.</p>
        `;

        await sendMail(email, 'Your Two-Factor Authentication Code', content);

        return res.status(200).json({
            success: true,
            msg: "OTP sent successfully!",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
};

/**
 * Verify OTP for 2FA
 */
const verify2FAOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Retrieve OTP from the store
        const storedOtpData = otpStore.get(email);
        if (!storedOtpData) {
            return res.status(400).json({
                success: false,
                msg: "No OTP found or OTP expired!",
            });
        }

        // Check if OTP is expired
        if (Date.now() > storedOtpData.expiresAt) {
            otpStore.delete(email);
            return res.status(400).json({
                success: false,
                msg: "OTP has expired!",
            });
        }

        // Validate OTP
        if (storedOtpData.otp !== otp) {
            return res.status(400).json({
                success: false,
                msg: "Invalid OTP!",
            });
        }

        // OTP verified, remove it from the store
        otpStore.delete(email);

        return res.status(200).json({
            success: true,
            msg: "OTP verified successfully!",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            msg: error.message,
        });
    }
};





// Create New User API Method

const createNewUser = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            });
        }

        const { name, email } = req.body;

        const isExists = await User.findOne({
            email
        })

        if (isExists) {
            return res.status(400).json({
                success: false,
                msg: 'Sorry, This E-mail is already exists!'
            });
        }

        const password = randomstring.generate(8);
        const hashedPassword = await bcrypt.hash(password, 10);

        var obj = {
            name,
            email,
            password: hashedPassword
        }

        if (req.body.role && req.body.role == 1) {

            return res.status(400).json({
                success: false,
                msg: 'Creating admin users is not allowed.'
            });

        }
        else if (req.body.role) {
            obj.role = req.body.role;
        }

        const newUser = new User(obj);

        const userData = await newUser.save();

        console.log(password);

        const content = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <p style="font-size: 18px;">Hello ${userData.name},</p>
                
                <p style="font-size: 16px;">Welcome to VRV! Your registration was successful, and your account is now active.</p>

                <p style="font-size: 16px;">Here are your login details:</p>
                
                <ul style="list-style: none; padding: 0; font-size: 16px;">
                    <li><strong>Email:</strong> ${userData.email}</li>
                    <li><strong>Password:</strong> ${password}</li>
                </ul>

                <p style="font-size: 16px;">Keep this information secure and do not share it with anyone. If you have any questions or need assistance, feel free to contact our support team at <a href="mailto:support@example.com" style="color: #007BFF; text-decoration: none;">support@example.com</a>.</p>

                <p style="font-size: 16px;">Thank you for choosing VRV! We look forward to serving you.</p>

                <p style="font-size: 16px;">Best regards,<br>
                VRV Team</p>
            </div>
        `;

        sendMail(userData.email, 'Your registration was successful, and your account is now active.', content);

        return res.status(200).json({
            success: true,
            msg: 'New User Created Successfully!',
            data: userData
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message,
        });
    }

}

// Get All Users API Method

const getUsers = async (req, res) => {

    try {

        // console.log(req.user._id);

        const users = await User.find({
            _id: {
                $ne: req.user._id
            }
        });

        return res.status(200).json({
            success: true,
            msg: 'Users Data Fetched Successfully',
            data: users
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message,
        });
    }

}

// Update User Data API Method

const updateUser = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            });
        }

        const { id, name } = req.body;

        const isExists = await User.findOne({
            _id: id
        });

        if (!isExists) {
            return res.status(400).json({
                success: false,
                msg: 'Sorry, This user does not exist!'
            });
        }

        var updateObj = {
            name
        }

        if (req.body.role != undefined) {
            updateObj.role = req.body.role;
        }

        const userUpdatedData = await User.findByIdAndUpdate({ _id: id }, {
            $set: updateObj
        }, { new: true });

        return res.status(200).json({
            success: true,
            msg: 'User Data Updated Successfully!',
            data: userUpdatedData
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message,
        });
    }

}

// Delete User API Method

const deleteUser = async (req, res) => {

    try {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                msg: 'Errors',
                errors: errors.array()
            });
        }

        const { id } = req.body;

        const isExists = await User.findOne({
            _id: id
        });

        if (!isExists) {
            return res.status(400).json({
                success: false,
                msg: 'User Not Found.',
            });
        }

        await User.findByIdAndDelete({
            _id: id
        });

        return res.status(200).json({
            success: true,
            msg: 'User Record Deleted Succcessfully!',
        });

    } catch (error) {
        return res.status(400).json({
            success: false,
            msg: error.message,
        });
    }

}

module.exports = {
    createNewUser,
    getUsers,
    updateUser,
    deleteUser,
    send2FAOTP,
    verify2FAOTP
}