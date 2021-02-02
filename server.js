const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors:{
        origin: "*",
    }
});

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