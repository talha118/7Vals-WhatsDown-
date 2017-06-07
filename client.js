var socket = io();
var state = {}
const setState = updates=>{
	Object.assign(state,updates)
	ReactDOM.render(React.createElement(Root,state),document.getElementById('root'))
}
const check = (event)=>{
	console.log("hi")
}
const LogIn = (event,username,password)=>{
	// event.preventDefault()
	// console.log("came to authenticate")
	socket.emit('authenticate',username,password);
}
const Register = (event,username,password)=>{
	socket.emit('addUser',username,password);
}
const getMessages =(event,username,secondUser)=>{
	console.log("lala",username,secondUser)
	socket.emit('start',username,secondUser)
	state.secondUser = secondUser
}
const submitHandler = (event,message)=>{

}
const Root = state=>{
	if(state.login == false){
		return React.createElement('div',null,
			React.createElement('input',{type:'text',className: 'form-control',value:state.username,placeholder:'username',onChange:(event)=>{
				username = event.target.value
				setState({username:username})
			}}),
			React.createElement('input',{type:'password',className:'form-control',value:state.password,placeholder:'password',onChange:(event)=>{
				password = event.target.value
				setState({password:password})
			}}),
			React.createElement('button',{className:'btn-primary',onClick:event=>LogIn(event,username,password)},"Log In"),
			React.createElement('button',{className:'btn-success', onClick:(event)=>Register(event,username,password)},"Register"),
			React.createElement('div',{hidden:state.hideInfo},state.info))
	}else{
		if(state.userList === true){
			console.log(state.users)
			return React.createElement('ul',null,
					state.users.map(user =>{
						return React.createElement('li',{onClick:(event)=>getMessages(event,state.username,user.username)},user.username)
					})
				)
		}else{
			return React.createElement('div',{className:'container'},
				React.createElement('div',{className:'row'},
					React.createElement('div',{className:'col-sm-4'}),
					React.createElement('div',{className:'col-sm-4'},
						React.createElement('button',{className:"class",onClick:(event)=>getUsers(event,state.username)},"contacts")),
					React.createElement('div',{className:'col-sm-4'}),
				React.createElement('div',{className:'row'},
					React.createElement('div',{className:'col-sm-4 col-sm-offset-4'},
						React.createElement('h2',null,state.secondUser)),
					React.createElement('div',{className:'col-sm-4'})),
				React.createElement('div',{className:'row'},
					state.messages.map(({sender,receiver,message})=>{
						if(sender === username)
							return React.createElement('div',{className:'col-sm-12'},message)
						else
							return React.createElement('div',{className:'col-sm-12 text-right'},message)	
				}))),
				React.createElement('div',{className:'myDiv'},
					React.createElement('input',{type:'text',value:state.messageToSend,className:'myInput',
						onChange:(event)=>setState({messageToSend: event.target.value})
						}),
					React.createElement('button',{className:'myButton',onClick:(event)=>{
						socket.emit('send',state.username,state.secondUser,state.messageToSend)
						messageTo = state.messageToSend
						setState({messages:[...state.messages,{sender:state.username,receiver:state.secondUser,message:messageTo}],messageToSend:''})
					}},"Send"))
				)
		}
	}
}

socket.on('registered',()=>{
//already registered user trying to resiter again
	setState({hideInfo: false, info : 'Already Registered User'})
});
socket.on('authenticated',()=>{
	//correct log in
	console.log("haha")
	setState({login:true})
	socket.emit('userList',state.username)	
})
const getUsers = (event,username)=>{
	socket.emit('userList',username)	
}
socket.on('listOfUsers',(result)=>{
	console.log('got messages')
	setState({users:result,userList:true,messageToSend:''})
})
socket.on('messages',messages=>{
	setState({messages:messages,userList:false})
})
socket.on('receiveMessage',(message)=>{
	console.log('messageReceived : ',message)
	setState({messages:[...state.messages,{sender:state.secondUser,receiver:state.user,message:message}]})
})
setState({login:false,username:'',password:'',secondUser:'', messages:[],userList:true,users:[],hideInfo:true})
socket.on('wrong_credentials',()=>{
	//invalid log in
	console.log('wrong_credentials')
	setState({hideInfo:false, info: 'Invalid login'})
})
socket.on('registerationComplete',()=>{
	setState({hideInfo:false, info:'Congratulations! You have registered.'})
})