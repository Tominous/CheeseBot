//Loading external libraries.
const mysql = require('mysql');

//Initialising module export.
const mySQLManager = {};

//Creating client.
let MySQLClient = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
});


function connect() {
    //Connect to the database.
    MySQLClient.connect(function (err) {
        if (err) {
            //IF it errors, destroy the connection then create a new one. Then attempt to connect again.
            MySQLClient.destroy();
            MySQLClient = mysql.createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE
            });
            console.log('error when connecting to db:', err);
            setTimeout(connect, 2000);
        }
    });

    //If there is a connection error, destroy the connection and create a new one, then try and reconnect.
    MySQLClient.on('error', function (err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === "PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR") {
            MySQLClient.destroy();
            MySQLClient = mysql.createConnection({
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE
            });
            connect();
        }
    });
}

connect();

mySQLManager.getPunishOnLoad = async function (callback) {
    MySQLClient.query("SELECT *  FROM punishments WHERE status = 1", function (err, result) {
        if (err) {
            console.log(err);
        }
        let punishments = [];
        for (let x of result) {
            let punishment = {
                id: x.id,
                user: x.discord_id,
                type: x.type,
                timestamp: x.timestamp,
                expire: x.expire,
                punisher: x.punisher,
                reason: x.reason,
                timer: null,
                status: x.status,
                removal_reason: x.removal_reason,
            };
            punishments.push(punishment);
        }
        callback(punishments);
    })
};

mySQLManager.getPunishments = async function (user, callback) {
    MySQLClient.query("SELECT * FROM punishments WHERE discord_id = '" + user + "'", function (err, result) {
        if (err) {
            console.log(err)
        }
        let punishments = [];
        //For each record, create a punishment object.
        for (let x of result) {
            let punishment = {
                id: x.id,
                user: x.discord_id,
                type: x.type,
                timestamp: x.timestamp,
                expire: x.expire,
                punisher: x.punisher,
                reason: x.reason,
                timer: null,
                status: x.status,
                removal_reason: x.removal_reason,
                remover: x.remover
            };
            punishments.push(punishment);
        }

        callback(punishments);
    });
};

mySQLManager.punish = async function (user, type, timestamp, expire, punisher, reason, status, callback) {
    MySQLClient.query("INSERT INTO `punishments`(discord_id,punisher,type,reason,timestamp,expire,status) VALUES ('" + user + "','" + punisher + "'," + type + ",'" + reason + "','" + timestamp + "','" + expire + "',1)", function (err) {
        if (err) {
            console.log(err)
        }
        MySQLClient.query("SELECT id FROM `punishments` WHERE (timestamp = '" + timestamp + "') AND (discord_id = '" + user + "')", function (err, result) {
            if (err) {
                console.log(err)
            }
            callback(result[0].id);
        })
    })
};

mySQLManager.expire = async function (punishment_id) {
    MySQLClient.query("UPDATE punishments SET status = 2, removal_reason = 'Expired' WHERE id = " + punishment_id, function (err) {
        if (err) {
            console.log(err)
        }
    });
};

mySQLManager.removePunishment = async function (user, type, reason, remover) {
    MySQLClient.query("UPDATE punishments SET status = 3, removal_reason = '" + reason + "', remover = '" + remover.tag + "' WHERE discord_id = " + user + " AND type = " + type, function (err) {
        if (err) {
            console.log(err)
        }
    });
    return true;
};


module.exports = mySQLManager;