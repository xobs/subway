var OverviewView = Backbone.View.extend({
  initialize: function() {
    var username;
    var password;
    var server;
    if (window.location.search && window.location.search.indexOf("?")>=0) {
      args = window.location.search.split("?")[1].split("&");
      for (i=0; i<args.length; i++) {
        arg = args[i].split("=");
        if (arg[0] === 'u') {
          username = arg[1];
        }
        else if (arg[0] === 'p') {
          password = arg[1];
        }
        else if (arg[0] === 's') {
          server = arg[1];
        }
      }
    }

    if (username) {
      if (password) {
        return this.connectAsAdmin(username, server, password, username);
      }
      else {
        return this.connectAsUser(username, server);
      }
    }
    else {
      return this.connectAsRandomGuest(server);
    }
  },

  events: {
    'click #connect-button': 'connect',
    'click #connect-more-options-button': 'more_options',
    'click #login-button': 'login_register',
    'click #register-button': 'login_register',
    'keypress': 'connectOnEnter',
    'click #connect-secure': 'toggle_ssl_options'
  },

  el: '.content',

  connectAsAdmin: function(username, server, password, nick) {
      if (irc.guest === undefined)
          irc.guest = false;
      if (irc.admin === undefined)
          irc.admin = true;
      if (!nick)
          nick = username;

      chan = new Array("#IGG");
      if (irc.admin)
        chan.push("#admin");

      var connectInfo = {
        username: username,
        nick: nick,
        server: server?server:"chat.iggmarathon.com",
        port: 6667,
        secure: false,
        selfSigned: false,
        rejoin: true,
        away: false,
        realName: username,
        password: password,
        channels: chan,
        encoding: "ISO-8859-1",
        keepAlive: true
      };

      irc.me = new User(connectInfo);
      //irc.me.on('change:nick', irc.appView.renderUserBox);

      irc.connect_info = connectInfo;
      irc.socket.emit('connect', connectInfo);
  },

  connectAsUser: function(username, server) {
      irc.admin = false;
      return this.connectAsAdmin(username, server, "");
  },

  connectAsRandomGuest: function(server) {
      username = "guest" + Math.round(Math.random()*131072+10000);
      irc.guest = true;
      return this.connectAsUser(username, server);
  },

  render: function(event) {
    $(this.el).html(ich.overview());

    // Navigation to different overview panes
    if (event === undefined) {
      $('#overview').html(ich.overview_home());
    } else {
      var func = ich['overview_' + event.currentTarget.id];
      $('#overview').html(func({'loggedIn': irc.loggedIn}));
    }

    $('.overview_button').bind('click', $.proxy(this.render, this));
    return this;
  },

  connectOnEnter: function(event) {
    if (event.keyCode !== 13) return;
    if($('#connect-button').length){
      this.connect(event);
    }
    if($('#login-button').length){
      event.action= 'Login';
      this.login_register(event);
    }
    if($('#register-button').length){
      event.action = 'Register';
      this.login_register(event);
    }
  },

  connect: function(event) {
    event.preventDefault();
    $('.error').removeClass('error');

    var server = $('#connect-server').val(),
    nick = $('#connect-nick').val(),
    port = $('#connect-port').val(),
    away = $('#connect-away').val(),
    realName = $('#connect-realName').val() || nick,
    secure = $('#connect-secure').is(':checked'),
    selfSigned = $('#connect-selfSigned').is(':checked'),
    rejoin = $('#connect-rejoin').is(':checked'),
    password = $('#connect-password').val(),
    encoding = $('#connect-encoding').val(),
    keepAlive = false;
    
    server = "chat.iggmarathon.com";
    realName = nick;
    if (!server) {
      $('#connect-server').closest('.control-group').addClass('error');
    }
    
    if (!nick) {
      $('#connect-nick').closest('.control-group').addClass('error');
    }

    if (irc.loggedIn && $('#connect-keep-alive').length) {
      keepAlive = $('#connect-keep-alive').is(':checked');
    }
    
    keepAlive = true;
    if (nick && server) {
      $('form').append(ich.load_image());
      $('#connect-button').addClass('disabled');

      var connectInfo = {
        nick: nick,
        server: server,
        port: port,
        secure: secure,
        selfSigned: selfSigned,
        rejoin: rejoin,
        away: away,
        realName: realName,
        password: password,
        encoding: encoding,
        keepAlive: keepAlive
      };

      irc.me = new User(connectInfo);
      irc.me.on('change:nick', irc.appView.renderUserBox);
      irc.socket.emit('connect', connectInfo);
    }
  },

  more_options: function() {
    this.$el.find('.connect-more-options').toggleClass('hide');
  },

  login_register: function(event) {
    var action = event.target.innerHTML.toLowerCase() || event.action.toLowerCase();
    event.preventDefault();
    $('.error').removeClass('error');

    var username = $('#' + action + '-username').val();
    var password = $('#' + action + '-password').val();
 
    if (!username) {
      $('#' + action + '-username').closest('.clearfix').addClass('error');
      $('#' + action + '-username').addClass('error');
    }
    
    if (!password) {
      $('#' + action + '-password').closest('.clearfix').addClass('error');
      $('#login-password').addClass('error');
    }
    
    if(username && password){
      $('form').append(ich.load_image());
      $('#' + action + '-button').addClass('disabled');
    }

    irc.socket.emit(action, {
      username: username,
      password: password
    });
  },

  toggle_ssl_options: function(event) {
    var port = $('#connect-secure').is(':checked') ? 6697 : 6667 ;
    $('#connect-port').attr('placeholder', port);
    $('#ssl-self-signed').toggle();
  }
});
