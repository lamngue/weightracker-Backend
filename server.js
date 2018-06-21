const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const {Client} = require('pg');

const postgres = knex({
  client: 'pg',
  connection: {
    connectionString : process.env.DATABASE_URL,
  	ssl: true,
  }
});

postgres.select('*').from('users').then(data => {
	console.log(data);
})
const app = express();
app.use(bodyParser.json())
app.use(cors());


app.get("/", (req,res) => {
	res.send('It is working')
})
app.post('/signin',(req,res)=>{
	postgres.select('email','hash').from('login')
	.where('email', '=', req.body.email)
	.then(data => {
		let isValid = bcrypt.compareSync(req.body.password, data[0].hash);
		if(isValid){
			return postgres.select('*').from('users')
			.where('email', '=', req.body.email)
			.then(user => {
				console.log(user[0])
				res.json(user[0])
			})
			.catch(err => res.status(400).json('Unable to get user'))
		}else{
			res.status(400).json('Wrong Credentials')
		} 
	})
	.catch(err => res.status(400).json('Wrong Credentials'))
})
app.post("/register",(req,res)=>{
	const {email,name,password} = req.body;
	if(!email || !name || !password){
		return res.status(400).json('Incorrect form submission')
	}
	const hash = bcrypt.hashSync(password);
	postgres.transaction((trx) => {
		trx.insert({
			hash: hash,
			email: req.body.email
		})
		.into('login')
		.returning('email')
		.then(logInEmail => {
			return trx('users')
			.returning('*')
			.insert({
				email: logInEmail[0],
				name: req.body.name,
				joined: new Date()
			}).then(user => {
				console.log(user[0])
				res.json(user[0]);
			})
		})
		.then(trx.commit)
		.catch(trx.rollback);
	})
	.catch(err => res.status(400).json({message: err.message}))
})

app.get("/profile/:id",(req,res)=>{
	const {id} = req.params;
	postgres.select('*').from('users').where({
		id: id
	}).then(user => {
		if(user.length){
		res.json(user[0])
	}else{res.status(400).json('not found')}})
	.catch(err => res.status(400).json('not found'));

})
app.put("/addWeight",(req,res)=>{
	const {id,data} = req.body;
	postgres('users')
	.where('id','=',id)
	.update({
		weightsovertime: knex.raw('array_append(weightsovertime, ?)', [data.weight])
	})
	.returning('weightsovertime')
	.then(response => {
		res.json(response[0])
	})
	.catch((err) => res.status(400).json('unable to get entries'))
})

app.put("/addDate",(req,res) => {
	const {id,data} = req.body;
	postgres('users')
	.where('id','=',id)
	.update({
		datesovertime: knex.raw('array_append(datesovertime, ?)', [data.date])
	})
	.returning('datesovertime')
	.then(response => {
		res.json(response[0])
	})
	.catch((err) => res.status(400).json('unable to get entries'))
})
app.delete("/delete",(req,res) => {
	const {email} = req.body;
	postgres('users')
	.where('email', '=', email)
	.del()
	.returning('*')
	.then(() => {
		res.json('Account Deleted')
	})
	.catch(err => res.status(400).json('unable to find user'))
})

app.listen(process.env.PORT || 3000,() => {
	console.log('app is running on port ' + process.env.PORT)
})

/*
/ --> res = this is working
/signin --> POST request = success/fail
/register --> POST request = user
/profile/:userId --> GET = user
/addWeight --> POST request 
*/