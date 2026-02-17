export const ValidationMessages = {
    email: {
        required: 'Email is required',
        invalidEmail: 'Enter valid email address',
    },

    username: {
        required: 'Full name required',
        invalidUsername: 'Invalid name'
    },

    password: {
        required: 'Password required',
        weakPassword: 'Must be of 8+ characters and include uppercase, lowercase, number and a special symbol'
    },

    confirmPassword: {
        required: 'Confirm your password',
        passwordMismatch: 'Passwords do not match'
    },

    vehicleName: {
        required: 'Vehicle name required',
        whitespace: 'Cannot be empty'
    },

    maxSeats: {
        required: 'Seat count required',
        invalidSeats: 'Seats must be between 1 and 10'
    },

    vehicleLicense: {
        required: 'License required',
        invalidLicense: 'Invalid license format. Example vehicle licence: AB12CD3456'
    }
};
