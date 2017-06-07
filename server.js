var mysql = require('mysql')
const http = require('http')
const socketio = require('socket.io')
const fs = require('fs')
const readFile = (filename) =>
  new Promise((resolve, reject) =>
    fs.readFile(filename, (err, data) =>
      err ? reject(err) : resolve(data.toString())))
const server = http.createServer(async(request, response) => {
  try {
    const data = await readFile(request.url.substr(1))
    response.end(data)
  } catch (error) {
    console.log(`Error : ${error}`)
  }
})
const io = socketio(server)
var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password : 'theprestige#2006',
    database: 'node'
})
db.connect(function(err){
    if (err) console.log(err)
})
let TotalUsers = []
db.query('SELECT username FROM user',(err,results,fields)=>{
	TotalUsers = results
})
const currentAuthenticatedUsers = []
io.sockets.on('connection',socket=>{
	socket.on('addUser',(username,password)=>{
		let found  = false
		TotalUsers.forEach((user)=>{
			if (user.username === username)
				found = true 
		})
		if (!found){
			db.query('INSERT INTO user (username,password) VALUES(?,?)',[username,password],(err,results,fields)=>{
				if(err)
					console.log(err)
				else{
					TotalUsers.push({username:username})
					socket.emit('registerationComplete')
				}
			})
		}else{
			socket.emit('registered')
		}
	})
	socket.on('authenticate',(username,password)=>{
		console.log("authenticate : ",username,password)
		db.query('SELECT username,password FROM user WHERE username = ? AND password =?',[username,password],(err,results,fields)=>{
			if(err)
				console.log(err)
			else{
				// results = JSON.stringify(results)
				console.log(results)
				if(results.length !== 0){
					currentAuthenticatedUsers.push({username : username, socket : socket})
					socket.emit('authenticated')
				}else{
					socket.emit('wrong_credentials')
				}
			}
		})
		
	})
	socket.on('userList',(username)=>{
		db.query('SELECT username FROM user WHERE username <> ?',username,(err,results,fields)=>{
			if(err)
				console.log(err)
			else{
				// results = JSON.stringify(results)
				socket.emit('listOfUsers',results)
			}
		})
	})
	socket.on("start",(username,secondUser)=>{
		console.log('getMessages',username,secondUser)
		db.query("SELECT sender,receiver,message FROM messages WHERE (sender = ? AND receiver = ? ) OR (sender = ? AND receiver = ?)",[username,secondUser,secondUser,username],(err,results,fields)=>{
			if(err)
				console.log(err)
			else{
				// results = JSON.stringify(results)
				socket.emit('messages',results)
			}
		})
	})
	socket.on("send",(username,secondUser,message)=>{
		console.log(username,secondUser,message)
		db.query("INSERT INTO messages (sender,receiver,message) VALUES (?,?,?)",[username,secondUser,message],(err,results,fields)=>{
			if(err)
				console.log(err)
			else{
				receiverUser = currentAuthenticatedUsers.filter(({username,socket})=>{
					if (username === secondUser)
						return true
					return false   
				})
				if(receiverUser.length !== 0){
					console.log(`sending to ${receiverUser[0].username}`)
					receiverUser[0].socket.emit('receiveMessage',message)
				}
			}
		})
	})
	socket.on('disconnect',()=>{
		currentAuthenticatedUsers = currentAuthenticatedUsers.filter(user=>user.socket === socket)
	})
})
server.listen(8000, () => {
  console.log('listening on *:8000')
})