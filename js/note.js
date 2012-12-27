if (!window.exports) {
	window.exports = {};
}

$(function() {
// Backbone:
//   indexeddb
var NoteDatabase = {
	id: "note"
	, description: "My Backbone-powered Notes"
	, migrations: [
		{
			version: 1
			, migrate: function(transaction, next) {
				transaction.db.createObjectStore("note");
				next();
			}
		},
		{
			version: 2
			, migrate: function(transaction, next) {
				var store;
				if (!transaction.db.objectStoreNames.contains("note")) {
					store = transaction.db.createObjectStore("note")
				} else {
					store = transaction.objectStore("note")
				}
				store.createIndex("titleIndex", "title", { unique: false });
				next();
			}
		}
	]
};

function DevelopDataBase () {
	var v = {
		setup: function() {
			
		}
		, teardown: function() {
			
		}
		, test: function() {
			add_note({ color: 'yellow'
				, style: 'left: 50px; top: 50px; position: absolute;'
			});
			add_note({ color: 'green', title: "untitled", content: "I am green"
				, style: 'left: 100px; top: 80px; position: absolute;'
			});
		}	
	};
	return v;
}
var database = DevelopDataBase();

var main = $("#main-container");
var noteIcon = $(".note-icon");
var hiddenNote = $("#hidden-note");

var Workspace, Note, Notes, NoteView;
var workspace;

Workspace = Backbone.Router.extend({
	initialize: function() {
		this.notes = new Notes();
		this.notesView = {};
		this.setDraggable();
		this.setButtons();
		this.fetchAll();
	}
	, fetchAll: function() {
		// database.test();
		this.notes.fetch({
			success: function(objs) {
				console.log("len of notes:" + objs.length);
				for (var i = 0; i < objs.length; i++) {
					var n = objs.at(i);
					console.log(n);
					workspace.addNote(n);
				}
			}
		});
	}
	, addNote: function (model) {
		model = model || {};
		var n = new Note(model);
		var nv = new NoteView({ model: n });	
		$(nv.el).hide()
			.appendTo(main)
			.fadeIn("slow");
		this.notes.add(n);
		this.notesView[nv.model.cid] = nv;
	}
	, removeNote: function (noteView) {
		delete this.notesView[noteView.model.cid];
		this.notes.remove(noteView.model);
	}
	, saveAll: function() {
		$("#sync-logo").show();
		$.each(this.notesView, function (k, noteView) {
			try { noteView.save(); }
			catch(e) { console.log(e); }
		});
		$("#sync-logo").delay(800).fadeOut("slow");
		this.isSaved(true);
	}
	, isSaved: (function() {
		var v = { saved: true };
		return function(saved) {
			if (arguments.length > 0) {
				v.saved = saved;
			}
			return v.saved;
		};
	})() 
	, setDraggable: function() {
		var dragtarget = null;
		noteIcon.draggable({
			revert: true
			, revertDuration: 500
			, helper: 'clone'
			// , grid: [50, 20]
			, opacity: 0.8
			, start: function(e) {
				$(this).draggable("option", "revertDuration", 500);
				return true;
			}
			, stop: function(e) {
				var ev = e.originalEvent;
				return true;
			}
		});
		
		main.droppable({
			greedy: true
			, activate: function(e, ui) {
				return true;
			}
			, deactivate: function(e, ui) {
				console.log("deactivate")
			}
			, over: function(e, ui) {
				var ev = e.originalEvent;
				ev.preventDefault();
				return false;
			}
			, out: function(e, ui) {
				return false;
			}
			, drop: function(e, ui) {
				var ev = e.originalEvent;
				if (ev.stopPropagation) ev.stopPropagation(); // stops the browser from redirecting...why???
				
				var draggable = ui.draggble,  // current draggable element, a jQuery object.
					helper = ui.helper,   // current draggable helper, a jQuery object
					pos = ui.position, // current position of the draggable helper { top: , left: }
					offset = ui.offset;  //  current absolute position of the draggable helper { top: , left: }

				if ( helper.hasClass("note-icon") ) {
					var left = pos.left - this.offsetLeft, 
						top = pos.top - this.offsetTop;
					var w = $(this).width(),
						h = $(this).height();
					// within the range:
					if (0 < left && left < w && 0 < top && top < h) {
						workspace.addNote({ color: helper.data("color")
							, style: 'left: ' + left +'px; top: ' + top + 'px; position: absolute'
						});
						
						// no revert
						$(draggable).draggable("option", "revert", false);
					} 
				}
				return false;
			}
		});
	}
	, setButtons : function() {
		$("#setting-sync").button({
			icons: {
				primary: "ui-icon-refresh"
			},
			text: false
		}).click(function() {
			workspace.saveAll();
		});
		
		$("#help").button({
            icons: {
                primary: "ui-icon-help"
            },
            text: false
      	}).click(function() {
      		$("#dialog-help").dialog({
      			height: 140
      			, modal: true
      			, resizable: false
      		});
      	});
	}
});

Note = Backbone.Model.extend({
	defaults: { title: ""
		, content: ""
		, color: ""
		, style: ""
    }
	, initialize: function (obj) { 
        this.fetch();
        console.log("id/cid: " + this.id + " " + this.cid);
    } 
    , validate: function (obj) {
    	// return string is error
   	}
    , toJSON: function() {
    	return { id: this.get("id"), 
    		title: this.get("title"), 
    		content: this.get("content"),
    		color: this.get("color"),
    		style: this.get("style")};
    }
    , database: NoteDatabase
	, storeName: NoteDatabase.id
});

Notes = Backbone.Collection.extend({
	model: Note
	, database: NoteDatabase
	, storeName: NoteDatabase.id
});

NoteView = Backbone.View.extend({
	tagName: "div"
	, className: "note"
	, template: _.template( $("script.note-template").html() )
	, initialize: function (args) { 
		// console.log("before bindAll");

        _.bindAll(this, 'render'
        		, 'changeTitle', 'changeContent', 'changeColor', 'changeStyle'
        		, 'onContentKeyDown', 'onContentMouseOver'
        		, 'showMenu', 'hideMenu'
                , 'remove', 'save'); 
        
        // console.log("before render");
        this.model.bind('change:title', this.changeTitle);
        this.model.bind('change:content', this.changeContent);
        this.model.bind('change:color', this.changeColor);
        this.model.bind('change:style', this.changeStyle);
        this.model.bind('destory', this.remove);
        this.model.bind('save', this.save);
        
        this.draggable = _.extend({
        	snapMode: "inner"
        	, containment: "parent"
 			, handle: ".title"
 			, stack: ".note"
 			, opacity: 0.6
 			, drag: function() { workspace.isSaved(false); }
        }, this.draggable);
        
        this.menuVisible = false;
        
        this.render();
    } 
    , events: {
        'click .title': 'handleTitleClick'
        , 'click .save': 'save'
        , 'click .remove': 'remove'
        , 'keydown .content': 'onContentKeyDown'
        , 'mouseover .content': 'onContentMouseOver'
        , 'mouseover .note-container': 'showMenu'
        , 'mouseout .note-container': 'hideMenu'
    }
    , render: function() {
    	// console.log(this.el);
		var template = this.template( { t : this.model.toJSON() } );
		this.$el.html(template);
		// will cause not contenteditable
		this.$el.draggable(this.draggable);
		this.$('.menu').toggle(this.menuVisible);
		this.$('.save').button({
			icons: { primary: "ui-icon-circle-check"}
			, text: false
		});
		this.$('.remove').button({
			icons: { primary: "ui-icon-trash" }
			, text: false
		});
		
		this.changeColor();
		this.changeStyle();
		return this;
	}
    , changeTitle: function () { 
        this.$('.title').text( this.model.get('title') );
        return this; 
    }
    , onContentKeyDown: function(e) {
    	if (e.which != 0) {
    		// wait save
    		workspace.isSaved(false);
    	}
    	return this;
    }
    , changeContent: function () {
        this.$('.content').html( this.model.get('content') );
        return this; 
    }
    , changeColor: function() {
    	this.$el.removeClass( function() {
    		var match = $(this).attr("class").match(/color-/) || [] ;
    		return match.join(" ");
    	}).addClass( "color-" + this.model.get('color') );
    	return this;
    }
    , changeStyle: function() {
    	$(this.el).attr("style", this.model.get("style"));
    	return this;
    }
    , handleTitleClick: function () {
        // alert('you clicked the title: ' + this.model.get('title')); 
    }
    , onContentMouseOver: function() {
    	this.$('.content').focus();
    	return this;
    }
    , showMenu: function() { 
    	if (!this.menuVisible) { 
    		this.menuVisible = true; 
    		this.$('.menu').show();
    	}; 
    	return this; 
    }
    , hideMenu: function() { 
    	if (this.menuVisible) {
    		this.menuVisible = false;
    		this.$('.menu').hide();
    	}
    	return this; 
    }
    , remove: function() {
    	workspace.removeNote(this);
    	this.$el.remove();
    	this.model.destroy();
    	console.log('removed' + this.model.cid);
    	console.log(this.model);
    }
    , save: function() {
    	var m = {
    		title: this.$('.title').html()
	      	, content: this.$('.content').html()
	      	, color: this.model.get('color')
	      	, style: this.$el.attr("style")
	    };
	    console.log(m)
	    this.model.set(m);
    	this.model.save();
	    console.log('saved' + this.model.cid);
	    console.log(this.model);
	    return this;
    }
});

console.log("begin");
workspace = new Workspace();

exports.workspace = workspace;

window.onbeforeunload = function(event) {
	// save all
	console.log("onbeforeunload: saveall");
	if (exports.workspace.isSaved() == false) {
		exports.workspace.saveAll();
		return "Are you sure to leave the page?";// || confirm("Are you sure to leave the page?");		
	}
};

});

