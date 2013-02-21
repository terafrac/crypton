
$(document).ready(function () {
  crypton.host = window.location.host;

  $('#login input').first().focus();
  $('#login input[type=submit]').click(function (e) {
    e.preventDefault();
    var action = e.target.name;
    var data = $('#login form').serializeArray();
    var username = data[0].value;
    var password = data[1].value;
    actions[action](username, password);
  });
});

var actions = {};

actions.login = function (username, password) {
  var $form = $('#login form');
  var $status = $('#login #status');

  $form.hide();
  $status.show();
  $status.text('Logging in...');

  crypton.authorize(username, password, function (err, session) {
    if (err) {
      $form.show();
      $status.text(err);
      $('#login input').first().focus();
      return;
    }

    window.session = session;
    $('#login').hide();
    $('body').removeClass('login');
    init();
  });
};

actions.register = function (username, password) {
  var $form = $('#login form');
  var $status = $('#login #status');
  var $progressBar = $('#login .progressBar');
  var $progress = $progressBar.find('.progress');

  $form.hide();
  $status.show();
  $progressBar.show();
  $status.text('Generating encryption keys...');

  var messages = [
    'Generating encryption keys...',
    'Doing a bunch of math...',
    'Making your diary really, really safe...'
  ];

  var steps = 0;
  crypton.generateAccount(username, password, function step () {
    steps++;
    $progress.width(Math.min((steps / 4048) * 300, 300));
    if (steps % 1000 === 0) {
      var message = messages.pop();
      $status.text(message);
      messages.unshift(message);
    }
  }, function done (err, account) {
    if (err) {
      $form.show();
      $status.text(err);
      $progressBar.hide();
      $('#login input').first().focus();
    } else {
      actions.login(username, password);
    }
  });
};

function init () {
  $('#app').show();
  setTimeout(function () {
    $('#header').removeClass('hiding');
  }, 100);
  loadDiary();
}

function setStatus (message) {
  $('#header span').text(message);
}

function loadDiary () {
  setStatus('Loading diary...');

  session.load('diary', function (err, container) {
    if (err) {
      session.create('diary', function (err, container) {
        window.diary = container;
        loadEntries();
      });
      return;
    }

    window.diary = container;
    loadEntries();
  });
}

function loadEntries () {
  setStatus('Loading entries...');
console.log(diary);
  diary.add('entries', function () {
console.log(arguments);
    diary.get('entries', function (err, entries) {
console.log(arguments);
      window.entries = entries;
      displayEntries();
    });
  });
}

function displayEntries () {
  setStatus('Rendering entries...');
  console.log(diary);
  console.log(entries);
}

function getEntry () {

}

function saveEntry () {

}

function deleteEntry () {

}



