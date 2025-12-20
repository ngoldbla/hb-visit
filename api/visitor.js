const mongoose = require('mongoose')
const Visitor = mongoose.model('visitor')
const Visit = mongoose.model('visit')
const jwt = require('jsonwebtoken')
const config = require('../config')
const bcrypt = require('bcryptjs')
const QRCode = require('qrcode')

module.exports = function (app, io) {
	//getting list of visitors
	app.get('/api/visitors/list', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret);
		if (decoded.role == 'Admin') {
			Visitor.find({}).then((docs) => {
				res.json({ status: true, docs })
			}).catch((error) => {
				res.json({ status: false, error })
			})
		}
	});

	app.post('/api/visitors/register', (req, res) => {
		const rawMobile = req.body.number ?? req.body.registered_mob ?? req.body.mobile ?? req.body.phone
		const digits = String(rawMobile ?? '').replace(/\D/g, '')
		const mobile = digits ? Number(digits) : null

		if (!mobile || Number.isNaN(mobile)) {
			return res.json({ status: false, error: 'Mobile number is required.' })
		}

		if (digits.length < 7 || digits.length > 15) {
			return res.json({ status: false, error: 'Mobile number must be 7–15 digits.' })
		}

		Visitor.find({
			registered_mob: mobile
		}).then((docs) => {
			if (docs.length > 0) {
				res.json({ status: false, error: 'The number is already registered' })
			} else {
				const visitor = new Visitor({
					registered_mob: mobile,
					name: req.body.name,
					password: req.body.password ?? digits
				})
				visitor.save().then((doc) => {
					res.json({
						status: true,
						doc,
						loginIdentifier: '+' + digits,
						message: "Registration successful! Log in with your mobile number: +" + digits
					})
				}).catch((error) => {
					res.json({ status: false, error })
				})
			}
		}).catch((error) => {
			res.json({ status: false, error })
		})
	})

	app.post('/api/visitors/get', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret)
		Visitor.findOne({
			_id: req.body.id
		}).then((doc) => {
			res.json({ status: true, doc })
		}).catch((error) => {
			res.json({ status: false, error })
		})
	})

	app.post('/api/visitors/delete', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret)
		if (decoded.role == 'Admin') {
			Visitor.deleteOne({
				_id: req.body.id
			}).then((doc) => {
				res.json({ status: true, message: "Deleted Successfully" })
			}).catch((error) => {
				res.json({ status: false, error })
			})
		}
	})

	app.post('/api/visitors/getGatepass', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret)
		Visitor.find({
			_id: decoded._id
		}).then((docs) => {
			QRCode.toDataURL(docs[0]._id.toString(), function (err, url) {
				if (!err) {
					res.json({ status: true, data: url })
				} else {
					console.log(err)
					res.json({ status: false })
				}
			})
		})
	})

	app.post('/api/visitors/visited', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret)
		if (decoded.role == 'Guard') {
			var visit = new Visit()
			visit.guard_in = req.body.guard
			visit.gate_in = req.body.gate
			visit.no_visitors = req.body.no_visitors
			visit.visitor = {
				name: req.body.visitor.name,
				_id: req.body.visitor._id,
				registered_number: req.body.visitor.registered_mob
			}
			visit.save().then((doc) => {
				Visitor.updateOne({
					_id: req.body.visitor._id
				}, { is_in: true }).then((doc) => {
					res.json({ status: true, message: "Visitor's visit is started" })
				}).catch((error) => {
					res.json({ status: false, message: "Internal Error.", error: error })
				})
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error.", error: error })
			})
		} else {
			res.json({ status: false, message: "Unauthorized Access" })
		}
	})

	app.post('/api/visitors/visitOver', (req, res) => {
		var decoded = jwt.verify(req.headers['authorization'], config.secret)
		if (decoded.role == 'Guard') {
			Visit.updateOne({
				"visitor._id": req.body.visitor._id,
				"guard_out": null
			}, {
				guard_out: req.body.guard,
				gate_out: req.body.gate
			}).then((doc) => {
				Visitor.updateOne({
					_id: req.body.visitor._id
				}, { is_in: false }).then((doc) => {
					res.json({ status: true, message: "Visitor's visit is completed" })
				}).catch((error) => {
					res.json({ status: false, message: "Internal Error.", error: error })
				})
			}).catch((error) => {
				res.json({ status: false, message: "Internal Error.", error: error })
			})
		} else {
			res.json({ status: false, message: "Unauthorized Access" })
		}
	})

}
