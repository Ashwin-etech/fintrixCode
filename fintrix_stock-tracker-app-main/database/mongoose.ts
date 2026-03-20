import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if (!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if (!MONGODB_URI) throw new Error('MONGODB_URI must be set within .env');

    if (cached.conn) {
        // Connection is already established, check if it's still connected
        if (cached.conn.connection.readyState === 1) {
            return cached.conn;
        }
        // Connection is disconnected, reset cache
        cached.conn = null;
        cached.promise = null;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            // Connection pooling settings
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4, // Use IPv4, skip trying IPv6
            retryWrites: true, // Retry writes upon network errors
            retryReads: true, // Retry reads upon network errors
            // Performance optimizations
            compressors: ['snappy', 'zstd'] as ('snappy' | 'zstd' | 'none' | 'zlib')[],
            zlibCompressionLevel: 6 as const, // Compression level
        };

        cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    try {
        cached.conn = await cached.promise;

        // Enable performance monitoring in development
        if (process.env.NODE_ENV === 'development') {
            mongoose.set('debug', true);
        }

        // Configure connection settings for performance
        cached.conn.set('autoIndex', false); // Disable auto-indexing in production

        console.log(`Connected to database ${process.env.NODE_ENV} - ${MONGODB_URI}`);
    } catch (err) {
        cached.promise = null;
        console.error('Database connection failed:', err);
        throw err;
    }

    return cached.conn;
}

// Graceful connection cleanup
export const disconnectFromDatabase = async () => {
    if (cached.conn) {
        await cached.conn.connection.close();
        cached.conn = null;
        cached.promise = null;
        console.log('Disconnected from database');
    }
};

// Health check for database connection
export const checkDatabaseHealth = async () => {
    try {
        if (!cached.conn) {
            return { status: 'disconnected', message: 'No active connection' };
        }

        const state = cached.conn.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

        return {
            status: states[state],
            message: `Database is ${states[state]}`,
            healthy: state === 1
        };
    } catch (error) {
        return {
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            healthy: false
        };
    }
};
