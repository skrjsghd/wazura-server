const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors:{
        origin: "*",
    }
});

const con = mysql.createConnection({
    host:'localhost',
    user: 'root',
    password: '1234',
    database: 'Wazura'
});

con.connect(function(err) {
    if (err) throw err;
    console.log('database connected')
})


app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(cors());

app.post('/api/login', (req, res) => {
    console.log(req.body);
    con.query(`SELECT id, password FROM keeper_info WHERE id = ${req.body.id} AND password = ${req.body.password}`, function(err, result, field) {
        if(err) throw err;
        if(result.length === 0){
            res.send('fail')
        } else{
            res.send('success')
        }
    })
})


// socket
const customerNamespace = io.of("/customer");
const keeperNamespace = io.of("/keeper");

customerNamespace.on('connection', (socket) => {
    console.log('hello_user')
    socket.on('reservation:create', (info)=>{
        socket.join(info.userInfo.customer_id);
        console.log(socket.rooms);
    
        keeperNamespace.emit('reservation:send', info)
        console.log('send info to keeper');
        }
    )

    socket.on('reservation:result', (result) => {
        console.log(result)
        keeperNamespace.emit('reservation:done', result)
    })
    
    socket.on('reservation:cancel', (cancel) => {
        keeperNamespace.emit('reservation:cancel_disconnect', cancel)
    })

    socket.on('disconnect', () => {
        console.log('bye');
    })
})

keeperNamespace.on('connection', (socket) => {
    console.log('hello_keeper')
    socket.on('reservation:service', (service) => {
        console.log(service)
        customerNamespace.to(service.userInfo.customer_id).emit('reservation:send_service', service)
        
    })
    
    socket.on('reservation:cancel_keeper', (store, customer) => {
        customerNamespace.to(customer).emit('reservation:cancel_keeper_get', store)
    })

    socket.on('disconnect', () => {
        console.log('bye');
    })
})
server.listen(5000, ()=>{
    console.log('server is running')
})