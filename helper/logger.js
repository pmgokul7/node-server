import log4js from 'log4js';

log4js.configure({
    appenders: {
        infoFile: {
            type: 'file',
            filename: 'logs/info.log',
            maxLogSize: 10485760, // 10MB
            backups: 3,
            layout: {
                type: 'pattern',
                pattern: '%d{yyyy-MM-dd HH:mm:ss} %-5p %m'
            }
        },
        errorFile: {
            type: 'file',
            filename: 'logs/error.log',
            maxLogSize: 10485760, // 10MB
            backups: 3,
            layout: {
                type: 'pattern',
                pattern: '%d{yyyy-MM-dd HH:mm:ss} %-5p %m'
            }
        },
        console: {
            type: 'console',
            layout: {
                type: 'pattern',
                pattern: '%d{yyyy-MM-dd HH:mm:ss} %-5p %m'
            }
        }
    },
    categories: {
        default: {
            appenders: ['console', 'infoFile'],
            level: 'info'
        },
        error: {
            appenders: ['console', 'errorFile'],
            level: 'error'
        }
    }
});

export const logger = log4js.getLogger();
export const errorLogger = log4js.getLogger('error');
