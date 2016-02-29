Todos = new Mongo.Collection('todos');
Lists = new Meteor.Collection('lists');


if(Meteor.isServer){
  // server code goes here

}

if(Meteor.isClient){
  // client code goes here

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

  Template.addTodo.events({
    'submit form': function(event){
      event.preventDefault();
      var todoNAme = $('[name="todoName"]').val();
      var currentList = this._id;
      var currentUser = Meteor.userId();
      Todos.insert({
        name: todoNAme,
        completed: false,
        createdAt: new Date(),
        createdBy: currentUser,
        listId: currentList
      });
      $('[name="todoName"]').val('');
    }
  });

  Template.todoItem.events({
    'click .delete-todo': function(event){
      event.preventDefault();
      var documentId = this._id;

      var confirm = window.confirm("Seriously?");
      if(confirm) {
        Todos.remove({_id: documentId});
      }
    },
    'keyup [name=todoItem]': function(event){
      if(event.which == 13 || event.which == 27) {
        $(event.target).blur();
      } else {
        var documentId = this._id;
        var todoItem = $(event.target).val();
        Todos.update({_id: documentId}, {$set: {name: todoItem}});
      }
    },
    'change [type=checkbox]': function(){
      var documentId = this._id;
      var isCompleted = this.completed;
      if(isCompleted){
        Todos.update({ _id: documentId }, {$set: { completed: false}});
        console.log("marked incomplete");
      } else {
        Todos.update({ _id: documentId }, {$set: { completed: true}});
        console.log("marked complete");
      }
    },
  });

  Template.addList.events({
    'submit form': function(event){
      event.preventDefault();
      var listName = $('[name=listName]').val();
      var currentUser = Meteor.userId();
      Lists.insert({
        name: listName,
        createdBy: currentUser
      }, function(error, results){
        Router.go('listPage', { _id: results });
      });
      $('[name=listName]').val('');
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
  layoutTemplate: 'main'
});
Router.route('/', {
  name: 'home',
  template: 'home'
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
  onAfterAction: function(){
    console.log("You triggered 'onAfterAction' for 'listPage' route.");
  },
  onStop: function(){
    console.log("You triggered 'onStop' for 'listPage' route.");
  },
});
