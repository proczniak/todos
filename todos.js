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
      return Todos.find({listId: currentList}, {sort: {createdAt: -1}});
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
      return Lists.find({}, {sort: {name: 1}});
    }
  });

  Template.addTodo.events({
    'submit form': function(event){
      event.preventDefault();
      var todoNAme = $('[name="todoName"]').val();
      var currentList = this._id;
      Todos.insert({
        name: todoNAme,
        completed: false,
        createdAt: new Date(),
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
      Lists.insert({
        name: listName
      }, function(error, results){
        console.log("error: " + error);
        console.log("results: " + results);
        Router.go('listPage', { _id: results });
      });
      $('[name=listName]').val('');
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
    return Lists.findOne({ _id: currentList });
  }
});