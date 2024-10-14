const userSchema = {
    email: { required: true },
    password: { required: true },
    name: { required: false },
    bio:  { required: false },
    admin: { required: false }
}

exports.userSchema = userSchema