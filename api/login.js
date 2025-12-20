const mongoose = require('mongoose')
const Visitor = mongoose.model('visitor')
const Admin = mongoose.model('admin')
const Guard = mongoose.model('guard')
const jwt = require('jsonwebtoken')
const config = require('../config')

module.exports = function (app, io) {

	app.post('/api/auth/login', (req, res) => {
		if (req.body.role == 'Visitor') {
			Visitor.findOne({
				registered_mob: req.body.userId
			}).then((doc) => {
				if (doc) {
					if (req.body.password == doc.password) {
						var payload = {
							_id: doc._id,
							role: 'Visitor',
							name: doc.name,
							userId: doc.registered_mob
						}
						let token = jwt.sign(payload, config.secret, {
							expiresIn: '20m'
						})
						res.json({ status: true, token: token })
					} else {
						res.json({
							status: false,
							error: "Incorrect password for this mobile number.",
							errorCode: "WRONG_PASSWORD"
						})
					}
				} else {
					res.json({
						status: false,
						error: "No visitor account found for that mobile number. Register first?",
						errorCode: "VISITOR_NOT_FOUND",
						action: "register"
					})
				}
			}).catch((error) => {
				console.log(error)
				res.json({ status: false, error: "An error occurred. Please try again." })
			})
		} else if (req.body.role == 'Admin') {
			Admin.findOne({
				userId: req.body.userId
			}).then((doc) => {
				if (doc) {
					if (req.body.password == doc.password) {
						var payload = {
							_id: doc._id,
							role: 'Admin',
							name: doc.name,
							userId: doc.userId
						}
						let token = jwt.sign(payload, config.secret, {
							expiresIn: '20m'
						})
						res.json({ status: true, token: token })
					} else {
						res.json({
							status: false,
							error: "Incorrect password.",
							errorCode: "WRONG_PASSWORD"
						})
					}
				} else {
					res.json({
						status: false,
						error: "No admin account found for that User ID.",
						errorCode: "ADMIN_NOT_FOUND"
					})
				}
			}).catch((error) => {
				res.json({ status: false, error: "An error occurred. Please try again." })
			})
		} else if (req.body.role == 'Guard') {
			Guard.findOne({
				userId: req.body.userId
			}).then((doc) => {
				if (doc) {
					if (req.body.password == doc.password) {
						var payload = {
							_id: doc._id,
							role: 'Guard',
							name: doc.name,
							userId: doc.userId,
							gate: doc.gate
						}
						let token = jwt.sign(payload, config.secret, {
							expiresIn: '20m'
						})
						res.json({ status: true, token: token })
					} else {
						res.json({
							status: false,
							error: "Incorrect password.",
							errorCode: "WRONG_PASSWORD"
						})
					}
				} else {
					res.json({
						status: false,
						error: "No guard account found for that User ID.",
						errorCode: "GUARD_NOT_FOUND"
					})
				}
			}).catch((error) => {
				res.json({ status: false, error: "An error occurred. Please try again." })
			})
		} else {
			res.json({
				status: false,
				error: 'Invalid role to login from'
			})
		}
	})

	app.post('/api/auth/register', (req, res) => {
		try {
			if (mongoose.connection.readyState !== 1) {
				return res.json({
					status: false,
					message: 'Database is not connected. Check MONGODB_URI.'
				})
			}

			const rawMobile = req.body.registered_mob ?? req.body.number ?? req.body.mobile ?? req.body.phone
			const digits = String(rawMobile ?? '').replace(/\D/g, '')
			const mobile = digits ? Number(digits) : null

			if (!mobile || Number.isNaN(mobile)) {
				return res.json({ status: false, message: 'Mobile number is required.' })
			}

			if (digits.length < 7 || digits.length > 15) {
				return res.json({ status: false, message: 'Mobile number must be 7–15 digits.' })
			}

			if (!req.body.password) {
				return res.json({ status: false, message: 'Password is required.' })
			}

			Visitor.findOne({ registered_mob: mobile }).then((existing) => {
				if (existing) {
					return res.json({ status: false, message: 'That mobile number is already registered.' })
				}

				const visitor = new Visitor({
					name: req.body.name,
					registered_mob: mobile,
					password: req.body.password
				})

				visitor.save().then((doc) => {
					res.json({
						status: true,
						doc,
						loginIdentifier: '+' + digits,
						message: "Registration successful! Log in with your mobile number: +" + digits
					})
				}).catch((error) => {
					console.error('Registration error:', error)
					res.json({ status: false, message: 'Internal Error' })
				})
			}).catch((error) => {
				console.error('Registration lookup error:', error)
				res.json({ status: false, message: 'Internal Error' })
			})
		} catch (error) {
			console.error('Registration handler error:', error)
			res.json({ status: false, message: 'Internal Error' })
		}
	})

	app.get('/api/auth/refresh', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret)
		var userPayload = {
			_id: decoded._id,
			name: decoded.name,
			userId: decoded.userId,
			role: decoded.role,
			gate: decoded.gate
		}
		let token = jwt.sign(userPayload, config.secret, {
			expiresIn: "20m"
		})
		res.json({ token: token })
	})

	app.post('/api/profile/changeName', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret);
		if (decoded.role == 'Admin') {
			Admin.updateOne({
				_id: decoded._id
			}, { name: req.body.name }).then((doc) => {
				res.json({ status: true, message: "Updated Successfully require logout" })
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error Ouccered" })
			})
		} else if (decoded.role == 'Visitor') {
			Visitor.updateOne({
				_id: decoded._id
			}, { name: req.body.name }).then((doc) => {
				res.json({ status: true, message: "Updated Successfully require logout" })
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error Ouccered" })
			})
		} else if (decoded.role == 'Guard') {
			Guard.updateOne({
				_id: decoded._id
			}, { name: req.body.name }).then((doc) => {
				res.json({ status: true, message: "Updated Successfully require logout" })
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error Ouccered" })
			})
		} else {
			res.json({ status: false, message: "You are trying inappropriate actions" })
		}
	})

	app.post('/api/profile/changePass', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret);
		if (decoded.role == 'Admin') {
			Admin.findOne({
				_id: decoded._id
			}).then((doc) => {
				if (doc.password == req.body.curPass) {
					Admin.updateOne({
						_id: doc._id
					}, { password: req.body.newPass }).then((doc) => {
						res.json({ status: true, message: "Password is updated." })
					}).catch((doc) => {
						res.json({ status: false, message: "Error while updating" })
					})
				} else {
					res.json({ status: false, message: "Old Password doesn't match" })
				}
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error Ouccered" })
			})
		} else if (decoded.role == 'Visitor') {
			Visitor.findOne({
				_id: decoded._id
			}).then((doc) => {
				if (doc.password == req.body.curPass) {
					Visitor.updateOne({
						_id: doc._id
					}, { password: req.body.newPass }).then((doc) => {
						res.json({ status: true, message: "Password is updated." })
					}).catch((doc) => {
						res.json({ status: false, message: "Error while updating" })
					})
				} else {
					res.json({ status: false, message: "Old Password doesn't match" })
				}
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error Ouccered" })
			})
		} else if (decoded.role == 'Guard') {
			Guard.findOne({
				_id: decoded._id
			}).then((doc) => {
				if (doc.password == req.body.curPass) {
					Guard.updateOne({
						_id: doc._id
					}, { password: req.body.newPass }).then((doc) => {
						res.json({ status: true, message: "Password is updated." })
					}).catch((doc) => {
						res.json({ status: false, message: "Error while updating" })
					})
				} else {
					res.json({ status: false, message: "Old Password doesn't match" })
				}
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error Ouccered" })
			})
		} else {
			res.json({ status: false, message: "You are trying inappropriate actions" })
		}
	})
}
