Todos = new Mongo.Collection('todos');
Lists = new Meteor.Collection('lists');


if(Meteor.isServer){

  Meteor.publish('lists', function(){
    var currentUser = this.userId;
    return Lists.find({ createdBy: currentUser});
  });

  Meteor.publish('todos', function(currentList){
    var currentUser = this.userId;
    return Todos.find({createdBy: currentUser, listId: currentList});
  });

  Meteor.methods({
    'createNewList': function(listName){
      console.log("Metoda createNewList zostala wywolana.");
      check(listName, String);
      var currentUser = Meteor.userId();
      if(listName == ""){
        listName = defaultName(currentUser);
      }
      var data = {
        name: listName,
        createdBy: currentUser
      }
      if (!currentUser){
        throw new Meteor.Error("not-logged-in biatch!", "You're not logged-in!");
      }
      return Lists.insert(data);
    },

    'createListItem': function(todoName, currentList){

      console.log('Metoda createListItem zostala wywolana');

      check(todoName, String);
      check(currentList, String);

      var currentUser = Meteor.userId();

      var data = {
        name: todoName,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
        listId: currentList
      }

      if (!currentUser){
        throw new Meteor.Error("not-logged-in", "You are not logged-in Biatch!" + currentUser);
      }

      var currentList = Lists.findOne(currentList);

      if(currentList.createdBy != currentUser){
        throw new Meteor.Error("break-in-attempt", "You don't own that list. Not cool!"  + "Lista: " + currentList + "User: " + currentUser);
      }
        console.log("dopisuję nowy item do listy");
        return Todos.insert(data);
    },



    'updateListItem': function(documentId, todoItem){
      check(todoItem, String);
      var currentUser = Meteor.userId();
      var data = {
        _id: documentId,
        createdBy: currentUser
      }
      if(!currentUser){
        throw new Meteor.Error("not-logged-in", "You're not logged-in.");
      }
      Todos.update(data, {$set: { name: todoItem }});
    },

    'changeItemStatus': function(documentId, status) {
      check(status, Boolean);
      var currentUser = Meteor.userId();
      var data = {
        _id: documentId,
        createdBy: currentUser
      }
      if(!currentUser){
        throw new Meteor.Error("not-logged-in", "You're not logged-in.");
      }
      Todos.update(data, {$set: { completed: status }});
    },

    'removeListItem': function(documentId){
      var currentUser = Meteor.userId();
      var data = {
        _id: documentId,
        createdBy: currentUser
      }
      if(!currentUser){
        throw new Meteor.Error("not-logged-in", "You're not logged-in.");
      }
      Todos.remove(data);
    }


  });



  function defaultName(currentUser) {
    var nextLetter = 'A'
    var nextName = 'List ' + nextLetter;
    while (Lists.findOne({ name: nextName, createdBy: currentUser })) {
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
      nextName = 'List ' + nextLetter;
    }
    return nextName;
  }
}

if(Meteor.isClient){

  Template.todos.helpers({
    'todo': function(){
      currentList = this._id;
      var currentUser = Meteor.userId();
      return Todos.find({createdBy: currentUser, listId: currentList}, {sort: {createdAt: -1}});
    }

  });

  Template.todoItem.helpers({
    'checked': function(){
      var isCompleted = this.completed;
      if(isCompleted){
        return "checked";
      } else {
        return "";
      }
    }
  });

  Template.todosCount.helpers({
    'totalTodos': function(){
      return Todos.find({listId: currentList}).count();
    },
    'completedTodos': function(){
      return Todos.find({listId: currentList, completed: true }).count();
      }
  });

  Template.lists.helpers({
    'list': function(){
      var currentUser =  Meteor.userId();
      return Lists.find({ createdBy: currentUser }, {sort: {name: 1}});
    }
  });

  Template.lists.onCreated(function(){
    this.subscribe('lists');
  });

  Template.addTodo.events({
    'submit form': function(event){
      event.preventDefault();
      var todoName = $('[name="todoName"]').val();
      var currentList = this._id;
      var currentUser = Meteor.userId();
      //Todos.insert({
      //  name: todoNAme,
      //  completed: false,
      //  createdAt: new Date(),
      //  createdBy: currentUser,
      //  listId: currentList
      //});
      //$('[name="todoName"]').val('');
      Meteor.call('createListItem', todoName, currentList, function(error){
        if(error){
          console.log(error.reason);
        }else{
          $('[name="todoName"]').val('');
        }
      });
    }
  });

  Template.todoItem.events({
    'click .delete-todo': function(event){
      event.preventDefault();
      var documentId = this._id;

      var confirm = window.confirm("Seriously?");
      if(confirm) {
        Meteor.call('removeListItem', documentId);
      }
    },
    'keyup [name=todoItem]': function(event){
      if(event.which == 13 || event.which == 27) {
        $(event.target).blur();
      } else {
        var documentId = this._id;
        var todoItem = $(event.target).val();
        //Todos.update({_id: documentId}, {$set: {name: todoItem}});
        Meteor.call('updateListItem', documentId, todoItem);
      }
    },
    'change [type=checkbox]': function(){
      var documentId = this._id;
      var isCompleted = this.completed;
      if(isCompleted){
        //Todos.update({ _id: documentId }, {$set: { completed: false}});
        Meteor.call('changeItemStatus', documentId, false);
      } else {
        //Todos.update({ _id: documentId }, {$set: { completed: true}});
        Meteor.call('changeItemStatus', documentId, true);
      }
    },
  });

  Template.addList.events({
    'submit form': function(event){
      event.preventDefault();
      var listName = $('[name=listName]').val();
      //var currentUser = Meteor.userId();
      //Lists.insert({
      //  name: listName,
      //  createdBy: currentUser
      //}, function(error, results){
      //  Router.go('listPage', { _id: results });
      //});
      //$('[name=listName]').val('');
      Meteor.call('createNewList', listName, function(error, results){
        if(error){
          console.log(error.reason);
        } else {
          Router.go('listPage', {_id: results});
          $('[name=listName]').val('');
        }
      });
    }
  });

  Template.register.events({
    'submit form': function(){
     /* event.preventDefault();
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      console.log(email);
      console.log($('[name=password]').val());
      Accounts.createUser({
        email: email,
        password: password
      }, function(error){
        if(error){
          console.log(error.reason);
        } else {
          Router.go('home');
        }
      });
      */
    }
  });

  Template.register.onRendered(function() {
    var validator = $('.register').validate({
      submitHandler: function(event){

        var email = $('[name=email]').val();
        var password = $('[name=password]').val();

        Accounts.createUser({
          email: email,
          password: password
        }, function(error){
          if(error){
            if(error.reason == "Email already exists."){
              validator.showErrors({
                email: "Takie konto już istnieje."
              });
            }
            console.log(error.reason);
          } else {
            Router.go('home');
          }
        });
      }
    });

  });

  Template.navigation.helpers({
    'loggedUzek': function(){
      return Meteor.user().emails[0].address;}
  });

  Template.navigation.events({
    'click .logout': function(event){
      event.preventDefault();
      Meteor.logout();
      Router.go('login');
    }
  });

  Template.login.events({
    'submit form': function(event){
      event.preventDefault();
/*
      var email = $('[name=email]').val();
      var password = $('[name=password]').val();
      Meteor.loginWithPassword(email, password, function(error){
        if (error) {
          console.log("Login process initiated.");
          console.log(error.reason);
          Router.go('login');
        } else {
          var currentRoute = Router.current().route.getName();
          if (currentRoute == "login") {
            Router.go('home');
          }
        }
      });
*/
    }
  });

  Template.login.onCreated(function(){
    console.log("The 'login' template was just created - onCreated().");
  });

  Template.login.onRendered(function(){
    var validator = $('.login').validate({
      submitHandler: function(event){
        console.log("Nacisnąłeś submit.");

        var email = $('[name=email]').val();
        var password = $('[name=password]').val();
        Meteor.loginWithPassword(email, password, function(error){
          if (error) {
            if(error.reason == "User not found"){
              validator.showErrors({
                email: "Takie konto nie istnieje w systemie."
              });
            }
            if(error.reason == "Incorrect password"){
              validator.showErrors({
                password: "Nieprawidłowe hasło."
              });
            }

          } else {
            var currentRoute = Router.current().route.getName();
            if (currentRoute == "login") {
              Router.go('home');
            }
          }
        });


      }
    });
  });

  Template.login.onDestroyed(function(){
    console.log("The 'login' template was just destroyed - onDestroyed().")
  });

  $.validator.setDefaults({
    rules: {
      email: {
        required: true,
        email: true
      },
      password: {
        required: true,
        minlength: 6
      }
    },
    messages: {
      email: {
        required: "Musisz podać email!",
        email: "Podany email nie jest prawidłowy"
      },
      password: {
        required: "Musisz wprowadzić hasło.",
        minlength: "Hasło musi zawierać minimum {0} znaków."

      }
    }
  });

}

Router.configure({
  layoutTemplate: 'main',
  oadingTemplate: 'loading'
});
Router.route('/', {
  name: 'home',
  template: 'home',
  waitOn: function(){
    return Meteor.subscribe('lists');
  }
});
Router.route('/register');
Router.route('/login');
Router.route('/list/:_id', {
  name: 'listPage',
  template: 'listPage',
  data: function(){
    var currentList = this.params._id;
    var currentUser = Meteor.userId();
    return Lists.findOne({ _id: currentList, createdBy: currentUser });
  },
  onRun: function(){
    console.log("You triggered 'onRun' for 'listPage' route.");
    this.next();
  },
  onBeforeAction: function(){
    console.log("You triggered 'onBeforeAction' for 'listPage' route.");
    var currentUser = Meteor.userId();
    if(currentUser){
      this.next();
    } else {
      this.render('login');
    }
  },
  waitOn: function(){
    var currentList = this.params._id;
    return Meteor.subscribe('todos', currentList);
  },
  onAfterAction: function(){
    console.log("You triggered 'onAfterAction' for 'listPage' route.");
  },
  onStop: function(){
    console.log("You triggered 'onStop' for 'listPage' route.");
  }
});
