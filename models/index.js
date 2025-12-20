const mongoose = require('mongoose');

mongoose.set('bufferCommands', false);

const url =
	process.env.MONGODB_URI ||
	process.env.MONGODB_URL ||
	process.env.MONGO_URL ||
	process.env.MONGO_URI ||
	process.env.DATABASE_URL;

if (!url) {
	console.warn('MONGODB_URI is not set; database features will be unavailable.');
} else {
	mongoose
		.connect(url, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
			useFindAndModify: false,
			useCreateIndex: true
		})
		.catch((err) => console.error('Error connecting to MongoDB:', err));

	mongoose.connection.on('connected', () => {
		console.log('Database connected...');
	});

	mongoose.connection.on('error', (err) => {
		console.error('MongoDB connection error:', err);
	});
}

require('./visitors')
require('./visit')
require('./admin')
require('./guard')
