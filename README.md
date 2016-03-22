# node-gogs-client
A client library for interacting with the [Gogs](https://gogs.io) REST api. This library is written to communicate according to the api defined in [gogits/go-gogs-client](https://github.com/gogits/go-gogs-client/wiki).

Everything returns a promise!

##Supported Operations
* create user
* search users
* get user
* delete user
* search repositories
* list user repositories
* create repository
* delete repository
* create application token
* list application tokens
* create public key
* get public key
* list public keys
* delete public key


## Requirements
* ECMAScript 6

## Installation
```
npm install gogs-client
```

## Examples
```
let api = new gogsClient('https://try.gogs.io/api/v1');
api.searchRepos('gogs', 0, 5).then(function(list) {
  console.log(list);
});
```

## Testing
In order to run the tests you'll need to create a `config.json` file in the test directory.
See the `sample.config.json` to get started.
You probably only need to change where the api points to and the credentials for the admin user.
Once configured you may run the following:
```
gulp test
```

##Method Arguments/Results
The format of data passed into/out-of a method closely matches that of the [GOGS API](https://github.com/gogits/go-gogs-client/wiki).

To get you started here are some basic objects and their properites

###User
```
{
  "username": ""
  "password": "",
  "token": ""
}
```

Not every property is required. The token will always take precedence over the username and password when used to authenticate a request.

Some methods require two users, one of which is the auth user. This allows you to control what account is authenticating the request. For example an admin user can create a repository for another user etc. However you choose to authenticate a request you must provide either a token or a username and password.

All methods are documented and indicate which properties are required for each argument.