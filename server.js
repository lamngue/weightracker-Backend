const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const app = express();
app.use(bodyParser.json())
app.use(cors())

const database = {
	users: [{
		id: '123',
		name: 'John',
		email: 'john@gmail.com',
		password: 'cookies',
		weightsOvertime: [],
		joined: new Date()
	},
	{
		id: '124',
		name: 'Sally',
		email: 'sally@gmail.com',
		password: 'bananas',
		weightsOvertime: [],
		joined: new Date()
	}]
}

app.get("/", (req,res) => {
	res.send(database.users)
})
app.post('/signin',(req,res)=>{
	if(req.body.email === database.users[0].email&&
		req.body.password === database.users[0].password||(req.body.email === database.users[1].email&&
		req.body.password === database.users[1].password)){
		res.json(database.users[0])
	}else{
		res.status(400).json('error logging in')
	}
})
app.post("/register",(req,res)=>{
	const {email,name,password} = req.body;
	database.users.push({
		id: '125',
		name: name,
		email: email,
		password: password,
		weightsOvertime: [],
		joined: new Date()
	})
	res.json(database.users[database.users.length-1])
})
app.get("/profile/:id",(req,res)=>{
	const {id} = req.params;
	let found = false;
	database.users.forEach(user=>{
		if(user.id == id){
			found = true;
			return res.json(user)
		}
	})
	if(!found){
		res.status(400).json('not found')
	}
})
app.put("/addWeight",(req,res)=>{
	const {id,data} = req.body;
	let found = false;
	database.users.forEach(user=>{
		if(user.id == id){
			found = true;
			user.weightsOvertime.push(data);
			return res.json(user.weightsOvertime)
		}
	})
	if(!found){
		res.status(400).json('not found')
	}
})

app.listen(3000,() => {
	console.log('app is running on port 3000')
})

/*
/ --> res = this is working
/signin --> POST request = success/fail
/register --> POST request = user
/profile/:userId --> GET = user
/addWeight --> POST request 
*/