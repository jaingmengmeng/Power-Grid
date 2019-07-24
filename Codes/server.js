const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '18810877326',
    database: 'power_grid',
    multipleStatements: true
});
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
app.use('/', express.static(__dirname + '/'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
    secret: 'secret',
    store: new FileStore(),
    saveUninitialized: false,
    resave: true,
    cookie: { maxAge: 10 * 60 * 1000 }
}));

server.listen(8888, () => {
    console.log('http://localhost:8888')
});

io.on('connection', function (socket) {
    socket.on('join', function (data) {
        var room_id = String(data.room_id);
        var user_name = data.user_name;
        socket.join(room_id, () => {
            socket.broadcast.to(room_id).emit('someone_join', { user_name: user_name, room_id: room_id });
            console.log("[socket.io]-" + user_name + '加入了' + room_id + '号房间');
        });
    });

    socket.on('join_game', function (data) {
        var room_id = "game" + String(data.room_id);
        var user_name = data.user_name;
        socket.join(room_id, () => {
            console.log("[socket.io]-" + user_name + '加入了' + room_id + '号游戏');
        });
    });

    socket.on('buy_station', function (data) {
        var room_id = "game" + String(data.room_id);
        var user_name = data.user_name;
        var index = data.index;
        socket.broadcast.to(room_id).emit('buy_station', { user_name: user_name, room_id: room_id, index: index });
        console.log("[socket.io]-" + user_name + '购买了' + String(index) + '号电厂');
    });

    socket.on('buy_city', function (data) {
        var room_id = "game" + String(data.room_id);
        var user_name = data.user_name;
        var index = data.index;
        socket.broadcast.to(room_id).emit('buy_city', { user_name: user_name, room_id: room_id, index: index });
        console.log("[socket.io]-" + user_name + '购买了' + String(index) + '号城市');
    });

    socket.on('leave', function (data) {
        var room_id = data.room_id;
        var user_name = data.user_name;
        var owner = data.owner;
        socket.leave(room_id, () => {
            io.sockets.in(room_id).emit('someone_leave', { user_name: user_name, room_id: room_id });
            console.log("[socket.io]-" + user_name + '离开了' + room_id + '号房间');
            if (owner == 1) {
                const strsql = 'DELETE FROM ROOM WHERE ROOM_id = ?';
                const params = [room_id];
                conn.query(strsql, params, (err, results) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log(user_name + '成功解散' + room_id + '号房间');
                });
            } else {
                const strsql1 = 'UPDATE ROOM SET ROOM_memnum = ROOM_memnum - 1 WHERE ROOM_id = ?';
                const params1 = [room_id];
                conn.query(strsql1, params1, (err, results) => {
                    if (err) {
                        console.log(err);
                    }
                    const strsql2 = 'DELETE FROM MEMBER WHERE ROOM_id = ? AND USER_name = ?';
                    const params2 = [room_id, user_name];
                    conn.query(strsql2, params2, (err, results) => {
                        if (err) {
                            console.log(err);
                        }
                        console.log(user_name + '成功离开' + room_id + '号房间');
                    });
                });
            }
        });
    });

    socket.on('begin', function (data) {
        var room_id = String(data.room_id);
        io.to(room_id).emit('begin', { room_id: room_id });
        console.log("[socket.io]-" + room_id + '号房间游戏开始');
    });
});

// To judge if user has logined a short time ago. If session not NULL, redirect to index, else redirect login.
app.get('/', (req, res) => {
    if (req.session.user_name) {
        console.log(req.session.user_name + "通过cookie登录成功");
        res.redirect('pages/hall.html?name=' + req.session.user_name);
    } else {
        res.redirect('pages/login.html');
    }
});

app.post('/login', (req, res) => {
    const user_name = req.body.name;
    const user_passwd = req.body.passwd;
    // console.log(user_name, user_passwd);
    const sqlStr = 'SELECT * FROM USER WHERE USER_name = ? AND USER_passwd = ?';
    var params = [user_name, user_passwd];
    conn.query(sqlStr, params, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ message: '登录失败' });
        }
        if (results[0] == null) {
            return res.json({ message: '登录失败' });
        }
        req.session.user_name = user_name;
        console.log(user_name + '登录成功');
        return res.json({ message: '登录成功' });
    });
});

app.get('/register', (req, res) => {
    const user_name = req.query.name;
    const user_passwd = req.query.passwd;
    // console.log(user_name, user_passwd);
    const sqlStr = 'INSERT INTO USER(USER_name, USER_passwd) VALUES (?,?)';
    var params = [user_name, user_passwd];
    conn.query(sqlStr, params, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ message: '该用户已存在' });
        }
        if (results.affectedRows != 1)
            return res.json({ message: '注册失败' });
        req.session.user_name = user_name;
        console.log(user_name + '注册成功');
        return res.json({ message: '用户创建成功' });
    });
});

app.get('/startgame', (req, res) => {
    const user_name = req.query.name;
    console.log(user_name);
    const strsql1 = 'SELECT * FROM ROOM WHERE ROOM_open = true AND ROOM_memnum < 6';
    conn.query(strsql1, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ room_id: 0, message: '匹配失败' });
        }
        if (results[0] == null) {
            // 没有房间正在准备中，创建一个房间
            return res.json({ room_id: 0, message: '没有房间正在准备中' });
        }
        var room_id = results[0].room_id;
        const strsql2 = 'UPDATE ROOM SET ROOM_memnum = ROOM_memnum + 1 WHERE ROOM_id = ?';
        const params2 = [room_id];
        conn.query(strsql2, params2, (err, results) => {
            if (err) {
                console.log(err);
                return res.json({ room_id: 0, message: '匹配失败' });
            }
            const strsql3 = 'INSERT INTO MEMBER (ROOM_id, USER_name) VALUES (?, ?)';
            const params3 = [room_id, user_name];
            console.log(params3);
            conn.query(strsql3, params3, (err, results) => {
                if (err) {
                    console.log(err);
                    return res.json({ room_id: 0, message: '匹配失败' });
                }
                console.log(user_name + '成功匹配' + room_id + '号房间');
                return res.json({ room_id: room_id, message: '匹配成功' });
            });
        });
    });
});

app.get('/createroom', (req, res) => {
    const user_name = req.query.name;
    console.log(user_name);
    const strsql1 = 'INSERT INTO ROOM (ROOM_owner, ROOM_open, ROOM_memnum) VALUES (?, true, 1)';
    const params1 = [user_name];
    conn.query(strsql1, params1, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ room_id: 0, message: '创建失败' });
        }
        const strsql2 = 'SELECT * FROM ROOM WHERE ROOM_owner = ? ORDER BY ROOM_id DESC';
        const params2 = [user_name];
        conn.query(strsql2, params2, (err, results) => {
            var room_id = results[0].room_id;
            // console.log(room_id);
            const strsql3 = 'INSERT INTO MEMBER (ROOM_id, USER_name) VALUES (?, ?)';
            const params3 = [room_id, user_name];
            conn.query(strsql3, params3, (err, results) => {
                if (err) {
                    console.log(err);
                    return res.json({ room_id: 0, message: '创建失败' });
                }
                console.log(user_name + '成功创建' + room_id + '号房间');
                return res.json({ room_id: room_id, message: '创建成功' });
            });
        });
    });
});

app.get('/joinroom', (req, res) => {
    const user_name = req.query.name;
    const room_id = req.query.room_id;
    console.log(user_name, room_id);
    const strsql1 = 'UPDATE ROOM SET ROOM_memnum = ROOM_memnum + 1 WHERE ROOM_id = ? AND ROOM_memnum < 6';
    const params1 = [room_id];
    conn.query(strsql1, params1, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ room_id: 0, message: '加入失败' });
        }
        const strsql2 = 'INSERT INTO MEMBER (ROOM_id, USER_name) VALUES (?, ?)';
        const params2 = [room_id, user_name];
        conn.query(strsql2, params2, (err, results) => {
            if (err) {
                console.log(err);
                return res.json({ room_id: 0, message: '加入失败' });
            }
            console.log(user_name + '成功加入' + room_id + '号房间');
            return res.json({ room_id: room_id, message: '加入成功' });
        });
    });
});

app.get('/get_all_rooms', (req, res) => {
    const strsql = 'SELECT * FROM ROOM WHERE ROOM_open = true AND ROOM_memnum < 6';
    conn.query(strsql, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ err_code: 1, message: '获取失败' });
        }
        if (results[0] == null) {
            // 没有房间正在准备中，创建一个房间
            return res.json({ err_code: 1, message: '没有房间正在准备中' });
        }
        return res.json({ err_code: 0, message: results });
    });
});

app.get('/get_all_players', (req, res) => {
    const room_id = req.query.room_id;
    const strsql = 'SELECT * FROM MEMBER WHERE ROOM_id = ?';
    const params = [room_id];
    conn.query(strsql, params, (err, results) => {
        if (err) {
            console.log(err);
            return res.json({ err_code: 1, message: '获取失败' });
        }
        if (results[0] == null) {
            // 没有房间正在准备中，创建一个房间
            return res.json({ err_code: 1, message: '该房间没有任何成员' });
        }
        return res.json({ err_code: 0, message: results });
    });
});
