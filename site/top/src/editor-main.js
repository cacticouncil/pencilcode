///////////////////////////////////////////////////////////////////////////
// REQUIRE JS path config
///////////////////////////////////////////////////////////////////////////
require.config({
  baseUrl: '/',
  paths: {
    'editor-view': 'src/editor-view',
    'editor-storage': 'src/editor-storage',
    'editor-debug': 'src/editor-debug',
    'draw-protractor': 'src/draw-protractor',
    'gadget': 'src/gadget',
    'filetype': 'src/filetype',
    'tooltipster': 'lib/tooltipster/js/jquery.tooltipster',
    'sourcemap': 'src/sourcemap',
    'ZeroClipboard': 'lib/zeroclipboard/ZeroClipboard',
    'FontLoader': 'src/FontLoader',
    'ice': 'lib/ice'
  },
  shim: {
    'tooltipster': {
       deps: ['jquery'],
       exports: 'jQuery.fn.tooltipster'
    },
    'see': {
       deps: ['jquery'],
       exports: 'see'
    }
  }
});

///////////////////////////////////////////////////////////////////////////
// MODEL, CONTROLLER SUPPORT
///////////////////////////////////////////////////////////////////////////

require([
  'jquery',
  'editor-view',
  'editor-storage',
  'editor-debug',
  'filetype',
  'seedrandom',
  'see',
  'draw-protractor'],
function(
  $,
  view,
  storage,
  debug,
  filetype,
  seedrandom,
  see,
  drawProtractor) {

eval(see.scope('controller'));

var model = {
  // Owner name of this file or directory.
  ownername: null,
  // True if /edit/ url.
  editmode: false,
  // Used by framers: an array of extra script for the preview pane, to
  // scaffold instructional examples.  See filetype.js wrapTurtle and
  // PencilCodeEmbed.setupScript to see how extra scripts are passed through.
  setupScript: null,
  // Contents of the three panes.
  pane: {
    alpha: {
      filename: null,
      isdir: false,
      data: null,
      bydate: false,
      loading: 0
    },
    bravo: {
      filename: null,
      isdir: false,
      data: null,
      bydate: false,
      loading: 0
    },
    charlie: {
      filename: null,
      isdir: false,
      data: null,
      bydate: false,
      loading: 0
    }
  },
  // Logged in username, or null if not logged in.
  username: null,
  // Three digit passkey, hashed from password.
  passkey: null,
  // secrets passed in from the embedding frame via
  // window.location.hash
  crossFrameContext: getCrossFrameContext()
};

//
// Retrieve model.pane object given position.  It will be one of
// the alpha, bravo or charlie objects from above.
//
// Parameters:
//    pos: Position is one of 'left', 'back' or 'right', which maps
//         to a class name of the element in the html
//
function modelatpos(pos) {
  return model.pane[paneatpos(pos)];
}

//
// Retrieve pane ID corresponding to given position.
//
// Parameters:
//    pos: Position is one of 'left', 'back' or 'right', which maps
//         to a class name of the element in the html
//
function paneatpos(pos) {
  return view.paneid(pos);
}

function posofpane(pane) {
  return view.panepos(pane);
}

//
// Special owner is defined as one of:
//   Nobody is the owner of this file/directory OR
//   it's the guide who's the owner OR
//   it's the event who's the owner
//
function specialowner() {
  return (!model.ownername || model.ownername === 'guide' ||
          model.ownername === 'gymstage' ||
          model.ownername === 'share' ||
          model.ownername === 'frame' ||
          model.ownername === 'event');
}

//
// A no-save owner is an owner that does not participate in saving
// or loading at all.  This is the case for framed usage.
//
function nosaveowner() {
  return model.ownername === 'frame';
}

function updateTopControls(addHistory) {
  var m = modelatpos('left');
  // Update visible URL and main title name.
  view.setNameText(m.filename);
  var slashed = m.filename;
  if (m.isdir && slashed.length) { slashed += '/'; }
  view.setVisibleUrl((model.editmode ? '/edit/' : '/home/') +
      slashed, addHistory)
  // Update top buttons.
  var buttons = [];

  //
  // If we're not in edit-mode, then push button to enter edit mode
  //

  if (!model.editmode) {
    buttons.push({id: 'editmode', label: 'Edit'});
  } else {
    //
    // Otherwise check if we have a data file
    //

    if (m.data && m.data.file) {
      //
      // If so, then insert save button
      //
      buttons.push(
        {id: 'save', title: 'Save program (Ctrl+S)', label: 'Save',
         disabled: !specialowner() && model.username &&
                   !view.isPaneEditorDirty(paneatpos('left')) });

      // Also insert share button
      if (!specialowner() || !model.ownername) {
        buttons.push({
          id: 'share', title: 'Share links to this program', label: 'Share'});
      }
    }

    //
    // If this directory is owned by some person (i.e. not specialowner)
    //

    if (!specialowner()) {
      // Applies to both files and dirs: a simple "new file" button.
      buttons.push({
        id: 'new', title: 'Make a new program', label: 'New'});

      //
      // Then insert logout/login buttons depending on if someone
      // is already logged in
      //
      if (model.username) {
        buttons.push({
          id: 'logout', label: 'Log out',
          title: 'Log out from ' + model.username});
      } else {
        buttons.push({
          id: 'login', label: 'Log in',
          title: 'Enter password for ' + model.ownername});
      }
    } else {
      // We're either in some file or directory
      if (m.isdir) {
        //
        // If it's a directory then allow browsing by date
        // or by alphabetical
        //

        if (m.bydate) {
          buttons.push({id: 'byname', label: 'Alphabetize'});
        } else {
          buttons.push({id: 'bydate', label: 'Sort by Date'});
        }
      }
    }
    buttons.push(
        {id: 'help', label: '<span class=helplink>?</span>' });
    if (m.data && m.data.file) {
      buttons.push({
        id: 'guide', label: '<span class=helplink>Guide</span>',
        title: 'Open online guide'});
    }
  }
  // buttons.push({id: 'done', label: 'Done', title: 'tooltip text'});
  view.showButtons(buttons);
  // Update middle button.
  if (m.data && m.data.file ||
      (modelatpos('right').data && modelatpos('right').data.file)) {
    view.showMiddleButton('run');
  } else {
    view.showMiddleButton('');
  }
  // Also if we're runnable, show an empty runner in the right.
  // Is this helpful or confusing?
  if (m.data && m.data.file) {
    if (!modelatpos('right').running) {
      var mimetext = view.getPaneEditorText(paneatpos('left')),
          code = (mimetext && mimetext.text) || m.data.data;
      // The last flag here means: run the supporting scripts
      // but not the main program.
      runCodeAtPosition('right', code, m.filename, true);
    }
  }
  // Update editability.
  view.setNameTextReadOnly(!model.editmode);
  view.setPaneEditorReadOnly(paneatpos('right'), true);
  view.setPaneEditorReadOnly(paneatpos('back'), true);
  view.setPaneEditorReadOnly(paneatpos('left'), !model.editmode);
}

//
// Now setup event handlers.  Each event handler corresponds to
// an ID (as specified in updateTopControls() above) and
// an event handler function
//

view.on('help', function() {
  view.flashNotification('<a href="//' +
     window.pencilcode.domain + '/group" target="_blank">Ask a question.</a>' +
    (model.username ?
        '&emsp; <a id="setpass" href="#setpass">Change password.</a>' : '')
  );
});

view.on('tour', function() {
  // view.flashNotification('Tour coming soon.');
  setTimeout(function() { view.flashNotification('Tour coming soon.');}, 0);
});

view.on('new', function() {
  if (modelatpos('left').isdir) {
    handleDirLink(paneatpos('left'), '#new');
    return;
  }
  var directoryname =
      modelatpos('left').filename.replace(/(?:^|\/)[^\/]*$/, '/');
  storage.loadFile(model.ownername, directoryname, false, function(m) {
    var untitled = 'untitled';
    if (m.directory && m.list) {
      untitled = chooseNewFilename(m.list);
    }
    if (directoryname == '/') {
      directoryname = '';
    }
    window.location.href = '/edit/' + directoryname + untitled;
  });
});

var lastSharedCode = '';
var lastSharedName = '';

view.on('share', function() {
  var shortfilename = modelatpos('left').filename.replace(/^.*\//, '');
  if (!shortfilename) { shortfilename = 'clip'; }
  var code = getEditTextIfAny() || '';
  if (!code) { return; }
  // First save if needed (including login user if necessary)
  if (view.isPaneEditorDirty(paneatpos('left'))) {
    saveAction(false, 'Log in to share', shareAction);
  } else {
    shareAction();
  }
  function shareAction() {
    // Then attempt to save on share.pencilcode.net
    var prefix = (60466175 - (Math.floor((new Date).getTime()/1000) %
        (24*60*60*500))).toString(36);
    var sharename =
        prefix + "-" + model.ownername + "-" +
        shortfilename.replace(/[^\w\.]+/g, '_').replace(/^_+|_+$/g, '');
    if (lastSharedName.substring(prefix.length) ==
        sharename.substring(prefix.length) && lastShareCode == code) {
      // Don't pollute the shared space with duplicate code; use the
      // same share filename if the code is the same.
      sharename = lastSharedName;
    }
    var data = $.extend({}, modelatpos('left').data, { data:code });
    storage.saveFile('share', sharename, data, true, 828, false, function(m) {
      var opts = { title: shortfilename };
      if (!m.error && !m.deleted) {
        opts.shareStageURL = "//share." + window.pencilcode.domain +
            "/home/" + sharename;
      }
      if (model.ownername) {
        // Share the run URL unless there is no owner (e.g., for /first).
        opts.shareRunURL = "//" + document.domain + '/home/' +
            modelatpos('left').filename;
      }
      opts.shareEditURL = window.location.href;
      // Now bring up share dialog
      view.showShareDialog(opts);
    });
  }
});

view.on('fullscreen', function(pane) {
  function showfullscreen() {
    window.open("/home/" + model.pane[pane].filename,
                "run-" + model.ownername);
  }
  if (view.isPaneEditorDirty(paneatpos('left'))) {
    if (model.ownername == model.username) {
      // Open immediately to avoid popup blocker.
      showfullscreen();
    }
    saveAction(false, 'Log in to save', showfullscreen);
  } else {
    showfullscreen();
  }
});

view.on('bydate', function() {
  if (modelatpos('left').isdir) {
    modelatpos('left').bydate = true;
    setDefaultDirSortingByDate(true);
    renderDirectory('left');
  }
});

view.on('byname', function() {
  if (modelatpos('left').isdir) {
    modelatpos('left').bydate = false;
    setDefaultDirSortingByDate(false);
    renderDirectory('left');
  }
});

view.on('dirty', function(pane) {
  if (posofpane(pane) == 'left') {
    view.enableButton('save', specialowner() || view.isPaneEditorDirty(pane));
  }
});

view.on('changelines', function(pane) {
  // End debugging session when number of lines is changed.
  if (posofpane(pane) == 'left') {
    debug.bindframe(null);
  }
});

view.on('editfocus', function(pane) {
  if (posofpane(pane) == 'right') {
    rotateModelLeft(true);
  }
});

view.on('run', function() {
  var mimetext = view.getPaneEditorText(paneatpos('left'));
  if (!mimetext) {
    mimetext = view.getPaneEditorText(paneatpos('right'));
    if (!mimetext) { return; }
    cancelAndClearPosition('back');
    rotateModelLeft(true);
  }
  var runtext = mimetext && mimetext.text;
  var newdata = $.extend({}, modelatpos('left').data, {data: runtext});
  view.clearPaneEditorMarks(paneatpos('left'));
  if (!specialowner()) {
    // Save file (backup only)
    storage.saveFile(model.ownername,
        modelatpos('left').filename, newdata, false, null, true);
  }
  // Provide instant (momentary) feedback that the program is now running.
  debug.flashStopButton();
  runCodeAtPosition('right', runtext, modelatpos('left').filename, false);
  if (!specialowner()) {
    // Remember the most recently run program.
    cookie('recent', window.location.href,
        { expires: 7, path: '/', domain: window.pencilcode.domain });
  }
});

$(window).on('beforeunload', function() {
  if (view.isPaneEditorDirty(paneatpos('left')) && !nosaveowner()) {
    view.flashButton('save');
    return "There are unsaved changes."
  }
});


view.on('logout', function() {
  model.username = null;
  model.passkey = null;
  cookie('login', '', { expires: -1, path: '/' });
  cookie('recent', '',
      { expires: -1, path: '/', domain: window.pencilcode.domain });
  updateTopControls(false);
  view.flashNotification('Logged out.');
});

view.on('login', function() {
  view.showLoginDialog({
    prompt: 'Log in.',
    username: model.ownername,
    validate: function(state) { return {}; },
    done: function(state) {
      model.username = model.ownername;
      model.passkey = keyFromPassword(model.username, state.password);
      state.update({info: 'Logging in...', disable: true});
      storage.setPassKey(
          model.username, model.passkey, model.passkey,
      function(m) {
        if (m.needauth) {
          state.update({info: 'Wrong password.', disable: false});
          model.username = null;
          model.passkey = null;
          return;
        } else if (m.error) {
          state.update({info: 'Could not log in.', disable: false});
          model.username = null;
          model.passkey = null;
          return;
        }
        state.update({cancel: true});
        saveLoginCookie();
        if (!specialowner()) {
          cookie('recent', window.location.href,
              { expires: 7, path: '/', domain: window.pencilcode.domain });
        }
        updateTopControls();
        view.flashNotification('Logged in as ' + model.username + '.');
      });
    }
  });
});

view.on('setpass', function() {
  view.showLoginDialog({
    prompt: 'Change password.',
    username: model.ownername,
    setpass: true,
    validate: function(state) {
      if (state.password === state.newpass) {
        return { disable: true };
      } else {
        return { disable: false };
      }
    },
    done: function(state) {
      var oldpasskey = keyFromPassword(model.ownername, state.password);
      var newpasskey = keyFromPassword(model.ownername, state.newpass);
      state.update({info: 'Changing password...', disable: true});
      storage.setPassKey(model.ownername, newpasskey, oldpasskey,
      function(m) {
        if (m.needauth) {
          state.update({info: 'Wrong password.', disable: false});
          return;
        } else if (m.error) {
          state.update({info: 'Could not change password.', disable: false});
          return;
        }
        state.update({cancel: true});
        model.username = model.ownername;
        model.passkey = newpasskey;
        saveLoginCookie();
        if (!specialowner()) {
          cookie('recent', window.location.href,
              { expires: 7, path: '/', domain: window.pencilcode.domain });
        }
        updateTopControls();
        view.flashNotification('Changed password for ' + model.username + '.');
      });
    }
  });
});

view.on('save', function() { saveAction(false, null, null); });
view.on('overwrite', function() { saveAction(true, null, null); });
view.on('guide', function() {
  window.open('//guide.' + window.pencilcode.domain + '/home/'); });

function saveAction(forceOverwrite, loginPrompt, doneCallback) {
  if (nosaveowner()) {
    return;
  }
  if (specialowner()) {
    signUpAndSave();
    return;
  }
  var mimetext = view.getPaneEditorText(paneatpos('left'));
  var runtext = mimetext && mimetext.text;
  var filename = modelatpos('left').filename;
  if (!runtext && runtext !== '') {
    // TODO: error message or something - or is this a deletion?
    return;
  }
  // TODO: pick the right mime type here.
  var newdata = $.extend({},
      modelatpos('left').data, { data: runtext, mime: mimetext.mime });
  // After a successful save, mark the file as clean and update mtime.
  function noteclean(mtime) {
    view.flashNotification('Saved.');
    view.notePaneEditorCleanText(
        paneatpos('left'), newdata.data);
    if (modelatpos('left').filename == filename) {
      var oldmtime = modelatpos('left').data.mtime || 0;
      if (mtime) {
        modelatpos('left').data.mtime = Math.max(mtime, oldmtime);
      }
    }
    updateTopControls();
  }
  if (newdata.auth && model.ownername != model.username) {
    // If we know auth is required and the user isn't logged in,
    // prompt for a login.
    logInAndSave(filename, newdata, forceOverwrite,
                 noteclean, loginPrompt, doneCallback);
    return;
  }
  // Attempt to save.
  view.flashNotification('', true);
  storage.saveFile(
      model.ownername, filename, newdata, forceOverwrite, model.passkey, false,
  function(status) {
    if (status.needauth) {
      logInAndSave(filename, newdata, forceOverwrite, noteclean,
                   loginPrompt, doneCallback);
    } else {
      if (!model.username) {
        // If not yet logged in but we have saved (e.g., no password needed),
        // then log us in.
        model.username = model.ownername;
      }
      handleSaveStatus(status, filename, noteclean);
      if (doneCallback) {
        doneCallback();
      }
    }
  });
}

function keyFromPassword(username, p) {
  if (!p) { return ''; }
  if (/^[0-9]{3}$/.test(p)) { return p; }
  var key = '';
  var prng = seedrandom('turtlebits:' + username + ':' + p + '.');
  for (var j = 0; j < 3; j++) {
    key += Math.floor(prng() * 10);
  }
  return key;
}

function letterComplexity(s) {
  var maxcount = 0, uniqcount = 0, dupcount = 0, last = null, count = {}, j, c;
  for (j = 0; j < s.length; ++j) {
    c = s.charAt(j);
    if (!(c in count)) {
      uniqcount += 1;
      count[c] = 0;
    }
    count[c] += 1;
    maxcount = Math.max(count[c], maxcount);
    if (c == last) { dupcount += 1; }
    last = c;
  }
  return uniqcount && (uniqcount / (maxcount + dupcount));
}

function signUpAndSave(options) {
  if (!options) { options = {}; }
  var mimetext = view.getPaneEditorText(paneatpos('left'));
  var mp = modelatpos('left');
  var runtext = mimetext && mimetext.text;
  var shouldCreateAccount = true;
  if (!runtext) {
    return;
  }
  var userList = [];
  storage.loadUserList(function(list) {
    if (list) {
      userList = list;
    }
  });
  view.showLoginDialog({
    prompt: options.prompt || 'Choose an account name to save.',
    rename: options.nofilename ? '' : (options.filename || mp.filename),
    center: options.center,
    cancel: options.cancel,
    info: 'Accounts on pencilcode are free.',
    validate: function(state) {
      var username = state.username.toLowerCase();
      shouldCreateAccount = true;
      for (var j = 0; j < userList.length; ++j) {
        if (userList[j].name.toLowerCase() == username) {
          if (userList[j].reserved) {
            return {
              disable: true,
              info: 'Name "' + username + '" reserved.'
            };
          } else if (options.newonly) {
            return {
              disable: true,
              info: 'Name "' + username + '" already used.'
            };
          } else {
            shouldCreateAccount = false;
            return {
              disable: false,
              info: 'Will log in as "' + username + '" and save.'
            };
          }
        }
      }
      if (username && !/^[a-z]/.test(username)) {
        return {
          disable: true,
          info: 'Username must start with a letter.'
        };
      }
      if (username && username.length > 20) {
        return {
          disable: true,
          info: 'Username too long.'
        };
      }
      if (username && !/^[a-z][a-z0-9]*$/.test(username)) {
        return {
          disable: true,
          info: 'Invalid username.'
        };
      }
      if (username && letterComplexity(username) <= 1) {
        // Discourage users from choosing a username "aaaaaa".
        return {
          disable: true,
          info: 'Name "' + username + '" reserved.'
        };
      }
      if (username && username.length >= 8 &&
          /(?:com|org|net|edu|mil)$/.test(username)) {
        // Discourage users from choosing a username that looks like
        // an email address or domain name.
        return {
          disable: true,
          info: 'Name should not end with "' +
              username.substr(username.length - 3) + '".'
        };
      }
      if (state.username.length < 3) {
        return {
          disable: true,
          info: 'Real names are <a target=_blank ' +
             'href="/privacy.html">not allowed</a>.' +
             '<br>When using a Pencil Code account,' +
             '<br><label>' +
             'I agree to <a target=_blank ' +
             'href="/terms.html">the terms of service<label></a>.'
        };
      }
      if (!options.nofilename && !state.rename) {
        return {
          disable: true,
          info: 'Choose a file name.'
        }
      }
      return {
        disable: false,
        info: 'Will create ' + username +
            '.' + window.pencilcode.domain + '.' +
             '<br>When using a Pencil Code account,' +
             '<br>I agree to <a target=_blank ' +
             'href="/terms.html">the terms of service</a>.'
      };
    },
    done: function(state) {
      var username = state.username.toLowerCase();
      if (username != model.ownername) {
        view.clearPane(paneatpos('right'), true);
      }
      var rename = state.rename || mp.filename;
      var forceOverwrite = (username != model.ownername) || specialowner();
      var key = keyFromPassword(username, state.password);
      var step2 = function() {
        storage.saveFile(
            username, rename, {data: runtext, mtime: 1},
            forceOverwrite, key, false,
            function(status) {
          if (status.needauth) {
            state.update({
              disable: false,
              info: 'Wrong password.'
            });
            view.clearPane(paneatpos('right'));
          } else if (status.newer) {
            state.update({
              disable: false,
              info: 'Did not overwrite newer file.'
            });
            view.clearPane(paneatpos('right'));
          } else if (status.transient) {
            state.update({
              disable: false,
              info: 'Network down.'
            });
            view.clearPane(paneatpos('right'));
          } else if (status.error) {
            state.update({
              disable: false,
              info: status.error
            });
            view.clearPane(paneatpos('right'));
          } else {
            view.notePaneEditorCleanText(paneatpos('left'), runtext);
            storage.deleteBackup(mp.filename);
            storage.deleteBackup(rename);
            state.update({cancel: true});
            var newurl =
                '//' + username + '.' + window.pencilcode.domain +
                '/edit/' + rename +
                '#login=' + username + ':' + (key ? key : '');
            if (options.nohistory) {
              window.location.replace(newurl);
            } else {
              window.location.href = newurl;
            }
          }
        });
      }
      if (key && shouldCreateAccount) {
        storage.setPassKey(username, key, null, function(m) {
          if (m.error) {
            console.log('got error');
            state.update({info: 'Could not create account.<br>' +
                m.error });
            view.clearPane(paneatpos('right'), false);
            return;
          }
          step2();
        });
      } else {
        step2();
      }
    }
  });
}

function logInAndSave(filename, newdata, forceOverwrite,
                      noteclean, loginPrompt, doneCallback) {
  if (!filename || !newdata || nosaveowner()) {
    return;
  }
  view.showLoginDialog({
    prompt: (loginPrompt) ? loginPrompt : 'Log in to save.',
    username: model.ownername,
    switchuser: signUpAndSave,
    validate: function(state) { return {}; },
    done: function(state) {
      model.username = model.ownername;
      model.passkey = keyFromPassword(model.username, state.password);
      state.update({info: 'Saving....', disable: true});
      storage.saveFile(
          model.username, filename, newdata, forceOverwrite,
          model.passkey, false,
      function(m) {
        if (m.needauth) {
          state.update({info: 'Wrong password.', disable: false});
          return;
        }
        state.update({cancel: true});
        handleSaveStatus(m, filename, noteclean);
        if (doneCallback) {
          doneCallback();
        }
      });
    }
  });
}

 function handleSaveStatus(status, filename, noteclean) {
  if (status.newer) {
    view.flashNotification('Newer copy on network. ' +
                           '<a href="#overwrite" id="overwrite">Overwrite</a>?');
  } else if (status.transient) {
    view.flashNotification('Network down.  Local backup made.');
  } else if (status.offline) {
    view.flashNotification('Offline.  Local backup made.');
  } else if (status.error) {
    view.flashNotification(status.error);
  } else if (status.deleted) {
    view.flashNotification('Deleted ' + filename.replace(/^.*\//, '') + '.');
    saveLoginCookie();
    if (model.ownername) {
      cookie('recent', window.location.href,
             { expires: 7, path: '/', domain: window.pencilcode.domain });
    }

    if (modelatpos('left').filename == filename) {
      cancelAndClearPosition('left');
      var parentdir = '';
      if (filename.indexOf('/') >= 0) {
        parentdir = filename.replace(/\/[^\/]+\/?$/, '');
      }
      loadFileIntoPosition('back', parentdir, true, true);
      rotateModelRight(true);
    }
  } else {
    noteclean(status.mtime);
    saveLoginCookie();
    if (!specialowner()) {
      cookie('recent', window.location.href,
             { expires: 7, path: '/', domain: window.pencilcode.domain });
    }
  }
}

function saveLoginCookie() {
  cookie('login', (model.username || '') + ':' + (model.passkey || ''),
         { expires: 1, path: '/' });
}

function chooseNewFilename(dirlist) {
  if (!dirlist) { return 'unutitled'; }
  if (dirlist.length === 0) { return 'first';}
  var maxNum = -1;
  for (var j = 0; j < dirlist.length; ++j) {
    var m = /^untitled(\d*)$/.exec(dirlist[j].name);
    if (m) {
      maxNum = Math.max(maxNum, m[1].length && parseInt(m[1]));
    }
  }
  if (maxNum < 0) { return 'untitled'; }
  if (maxNum == 0) { maxNum = 1; }
  return 'untitled' + (maxNum + 1);
}

view.on('link', handleDirLink);

function handleDirLink(pane, linkname) {
  var base = model.pane[pane].filename;
  if (base === null) { return; }
  if (base.length) { base += '/'; }
  if (posofpane(pane) == 'right') {
    cancelAndClearPosition('back');
    rotateModelLeft(true);
  }
  cancelAndClearPosition('back');
  if (linkname == '#new') {
    if (!model.pane[pane].data) { return; }
    var untitled = chooseNewFilename(model.pane[pane].data.list);
    createNewFileIntoPosition('right', base + untitled);
    rotateModelLeft(true);
    return;
  }
  var openfile = base + linkname.replace(/\/$/, '');
  var isdir = /\/$/.test(linkname);
  loadFileIntoPosition('right', openfile, isdir, isdir,
    function() { rotateModelLeft(true); });
}

view.on('linger', function(pane, linkname) {
  if (pane !== paneatpos('left')) { return; }
  var base = model.pane[pane].filename;
  if (base === null) { return; }
  if (base.length) { base += '/'; }
  if (linkname == '#new') {
    return;
  }
  var openfile = base + linkname.replace(/\/$/, '');
  var isdir = /\/$/.test(linkname);
  loadFileIntoPosition('right', openfile, isdir, isdir);
});

view.on('root', function() {
  if (view.isPaneEditorDirty(paneatpos('left'))) {
    view.flashButton('save');
  }
  if (!model.ownername) {
    window.location.href = '/';
    return;
  }
  if (modelatpos('left').filename === '') {
    loadFileIntoPosition('left', '', true, true);
  } else {
    var needToClear = modelatpos('left').filename &&
        modelatpos('left').filename.indexOf('/') >= 0;
    var pl = paneatpos('left');
    loadFileIntoPosition('back', '', true, true, function() {
      if (needToClear) {
        view.clearPane(pl)
      }
    });
    rotateModelRight(needToClear);
  }
});

view.on('editmode', function() {
  if (!model.editmode) {
    // Fake out updateTopControls to switch url to /edit/
    model.editmode = true;
    updateTopControls(true);
    // Then go back and readNewUrl to make it process as if the URL had
    // been changed by hand.
    model.editmode = false;
    readNewUrl();
  }
});

view.on('done', function() {
  if (view.isPaneEditorDirty(paneatpos('left'))) {
    view.flashButton('save');
  }
  doneWithFile(modelatpos('left').filename);
});

function doneWithFile(filename) {
  if (!filename || !model.ownername) {
    if (window.location.href ==
      '//' + window.pencilcode.domain + '/edit/') {
      window.location.href = '//' + window.pencilcode.domain + '/';
    } else {
      window.location.href = '//' + window.pencilcode.domain + '/edit/';
    }
  } else {
    if (filename.indexOf('/') >= 0) {
      filename = filename.replace(/\/[^\/]+\/?$/, '');
    } else {
      filename = '';
    }
    var newUrl = (model.editmode ? '/edit/' : '/home/') + filename;
    // A trick: if 'back' would be the same as going to the parent,
    // then just do a 'back'.
    if (history.state && history.state.depth > 0 &&
        history.state.previous == newUrl) {
      history.back();
    } else {
      loadFileIntoPosition('back', filename, true, true);
      rotateModelRight(true);
    }
  }
}

view.on('rename', function(newname) {
  var pp = paneatpos('left');
  var mp = modelatpos('left');
  if (mp.filename === newname || nosaveowner()) {
    // Nothing to do
    return;
  }
  // Error cases: go back to original name.
  // Can't rename the root (for now).
  // TODO: check for:
  // - moving directory inside itself
  // etc.
  if (!mp.filename) {
    view.setNameText(mp.filename);
    return;
  }
  function completeRename(newfile) {
    view.flashNotification(
        (newfile ? 'Using name ' : 'Renamed to ') + newname + '.');
    mp.filename = newname;
    view.noteNewFilename(pp, newname);
    updateTopControls(false);
    view.setPrimaryFocus();
  }
  var payload = {
    source: model.ownername + '/' + mp.filename,
    mode: 'mv'
  };
  if (model.passkey) {
    payload.key = model.passkey;
  }
  // Don't attempt to rename files without an owner on disk.
  // Otherwise, if the file is a directory or it is has an mtime,
  // it exists on disk and so we first rename it on disk.
  if (model.ownername && (mp.data.directory || mp.data.mtime)) {
    if (mp.data.auth && !model.username) {
      view.setNameText(mp.filename);
      logInAndMove(mp.filename, newname, completeRename);
    } else {
      storage.moveFile(
          model.ownername, mp.filename, newname, model.passkey, false,
      function(m) {
        if (m.needauth) {
          view.setNameText(mp.filename);
          logInAndMove(mp.filename, newname, completeRename);
          return;
        }
        if (m.error) {
          // Abort if there is an error.
          view.flashNotification(m.error);
          view.setNameText(mp.filename);
        } else {
          completeRename();
        }
      });
    }
  } else {
    // No mtime means it's purely local - just rename in memory.
    storage.deleteBackup(mp.filename);
    completeRename(true);
  }
});

view.on('popstate', readNewUrl);

function logInAndMove(filename, newfilename, completeRename) {
  if (!filename || !newfilename) {
    return;
  }
  view.showLoginDialog({
    prompt: 'Log in to rename.',
    username: model.ownername,
    validate: function(state) { return {}; },
    done: function(state) {
      model.username = model.ownername;
      model.passkey = keyFromPassword(model.username, state.password);
      state.update({info: 'Renaming....', disable: true});
      storage.moveFile(
          model.ownername, filename, newfilename, model.passkey, false,
      function(m) {
        if (m.needauth) {
          state.update({info: 'Wrong password.', disable: false});
          return;
        }
        state.update({cancel: true});
        if (m.error) {
          view.flashNotification(m.error);
        } else {
          saveLoginCookie();
          if (model.ownername) {
            cookie('recent', window.location.href,
                { expires: 7, path: '/', domain: window.pencilcode.domain });
          }
          completeRename();
        }
      });
    }
  });
}

function noteIfUnsaved(position) {
  var m = modelatpos(position).data;
  if (m && m.unsaved) {
    if (position === 'left') {
      view.flashNotification('Showing unsaved backup.' +
          (m.offline ? '' :
          ' <a href="#netload" id="netload">Load last saved version.</a>'));
    }
    view.notePaneEditorCleanText(paneatpos(position), '');
  }
}

function rotateModelLeft(addHistory) {
  debug.bindframe(null);
  view.rotateLeft();
  if (modelatpos('back').running) {
    cancelAndClearPosition('back');
  }
  noteIfUnsaved('left');
  updateTopControls(addHistory);
}

function rotateModelRight(addHistory) {
  debug.bindframe(null);
  view.rotateRight();
  if (modelatpos('back').running) {
    cancelAndClearPosition('back');
  }
  updateTopControls(addHistory);
}

function isFileWithin(base, candidate) {
  if (base.length && !/\/%/.test(base)) { base += '/'; }
  return candidate.length > base.length &&
      candidate.indexOf(base) === 0;
}

function readNewUrl(undo) {
  if (readNewUrl.suppress) {
    return;
  }
  // True if this is the first url load.
  var firsturl = (model.ownername === null),
  // Firefox incorrectly decodes window.location.hash, so this is consistent:
      hash = window.location.href.indexOf('#') < 0 ? '' :
          location.href.substring(window.location.href.indexOf('#')),
  // Owner comes from domain name.
      ownername = window.location.hostname.replace(
          /(?:(.*)\.)?[^.]*.{8}$/, '$1'),
  // Filename comes from URL minus first directory part.
      filename = window.location.pathname.replace(
          /^\/[^\/]+\//, '').replace(/\/+$/, ''),
  // Expect directory if the pathname ends with slash.
      isdir = /\/$/.test(window.location.pathname),
  // Extract login from hash if present.
      login = /(?:^|#|&)login=([^:]*)(?::(\w+))?\b/.exec(hash),
  // Extract text from hash if present.
      text = /(?:^|#|&)text=([^&]*)(?:&|$)/.exec(hash),
  // Extract newuser flag from hash if present.
      newuser = /(?:^|#|&)new(?:[=&]|$)/.exec(hash),
  // Extract setup script spec from hash if present.
      setup = /(?:^|#|&)setup=([^&]*)(?:&|$)/.exec(hash),
  // Extract edit mode
      editmode = /^\/edit\//.test(window.location.pathname);
  // Give the user a chance to abort navigation.
  if (undo && view.isPaneEditorDirty(paneatpos('left')) && !nosaveowner()) {
    view.flashButton('save');
    if (!window.confirm(
      "There are unsaved changes.\n\n" +
      "Are you sure you want to leave this page?")) {
      undo();
      return;
    }
  }
  if (!login) {
    var savedlogin = cookie('login');
    login = savedlogin && /\b^([^:]*)(?::(\w*))?$/.exec(cookie('login'));
  } else if (ownername) {
    // Remember credentials for 24 hours.
    cookie('login', login, { expires: 1, path: '/' });
    // Also remember as the most recently used program (without hash).
    cookie('recent', window.location.href.replace(/#.*$/, ''),
        { expires: 7, path: '/', domain: window.pencilcode.domain });
  }
  if (login) {
    model.username = login[1] || null;
    model.passkey = login[2] || null;
  }
  // Handle #new (new user) hash.
  var afterLoad = null;
  if (newuser) {
    afterLoad = (function() {
      signUpAndSave({
        center: true,
        nofilename: true,
        nohistory: true,
        newonly: true,
        prompt: 'Choose an account name',
        cancel: function() { history.back(); }
      });
    });
  }
  // Clean up the hash if present, and absorb the new auth information.
  if (hash.length) {
    readNewUrl.suppress = true;
    window.location.replace('#');
    view.setVisibleUrl(window.location.pathname);
    readNewUrl.suppress = false;
  }
  // Update global model state.
  var forceRefresh = false;
  if (model.ownername !== ownername || model.editmode !== editmode) {
    model.ownername = ownername;
    model.editmode = editmode;
    forceRefresh = true;
  }
  // Update setup scripts if specified.
  if (setup) {
    try {
      model.setupScript =
          JSON.parse(decodeURIComponent(setup[1].replace(/\+/g, ' ')));
    } catch(e) {
      if (window.console) {
        console.log('Unable to parse setup script spec: ' + e.message);
      }
    }
  }
  // If the new url is replacing an existing one, animate it in.
  if (!firsturl && modelatpos('left').filename !== null) {
    if (isFileWithin(modelatpos('left').filename, filename)) {
      cancelAndClearPosition('back');
      if (forceRefresh) {
        cancelAndClearPosition('right');
      }
      loadFileIntoPosition('right', filename, isdir, isdir, rotateModelLeft);
      return;
    } else if (isFileWithin(filename, modelatpos('left').filename)) {
      if (forceRefresh) {
        cancelAndClearPosition('back');
      }
      loadFileIntoPosition('back', filename, isdir, isdir);
      rotateModelRight(false);
      return;
    }
    if (!forceRefresh && filename == modelatpos('left').filename) {
      if (afterLoad) {
        afterLoad();
      }
      return;
    }
  }
  // Remove the preview pane if just browsing, or if browsing users.
  view.setPreviewMode(
      model.editmode && (model.ownername !== "" || filename !== ""), firsturl);
  // Preload text if specified.
  if (text != null) {
    var code = '';
    try {
       code = decodeURIComponent(text[1].replace(/\+/g, ' '));
    } catch (e) { }
    createNewFileIntoPosition('left', filename, code);
    updateTopControls(false);
    return;
  }
  // Regular startup: load the file.
  if (forceRefresh) {
    cancelAndClearPosition('left');
  }
  loadFileIntoPosition('left', filename, isdir, isdir, afterLoad);
}

function directNetLoad() {
  var pos = 'left';
  var filename = modelatpos(pos).filename;
  if (modelatpos(pos).data) {
    loadFileIntoPosition(pos, filename, false, true);
  }
}

view.on('netload', directNetLoad);

var loadNumber = 0;

function nextLoadNumber() {
  return ++loadNumber;
}

var stopButtonTimer = null;

function cancelAndClearPosition(pos) {
  debug.bindframe(null);
  view.clearPane(paneatpos(pos), false);
  modelatpos(pos).loading = 0;
  modelatpos(pos).filename = null;
  modelatpos(pos).isdir = false;
  modelatpos(pos).data = null;
  modelatpos(pos).bydate = false;
  modelatpos(pos).running = false;
}

function runCodeAtPosition(position, code, filename, emptyOnly) {
  var m = modelatpos(position);
  if (!m.running) {
    cancelAndClearPosition(position);
  }
  m.running = true;
  m.filename = filename;
  var baseUrl = filename && (
      window.location.protocol +
      '//' + (model.ownername ? model.ownername + '.' : '') +
      window.pencilcode.domain + '/home/' + filename);
  var pane = paneatpos(position);
  var html = filetype.modifyForPreview(
      code, filename, baseUrl, emptyOnly, model.setupScript);
  // Delay allows the run program to grab focus _after_ the ace editor
  // grabs focus.  TODO: investigate editor.focus() within on('run') and
  // remove this setTimeout if we can make editor.focus() work without delay.
  setTimeout(function() {
    if (m.running) {
      view.setPaneRunText(pane, html, filename, baseUrl,
         // Do not enable fullscreen mode when no owner, or a nosaveowner.
         model.ownername && !nosaveowner());
    }
  }, 1);
  if (code) {
    $.get('/log/' + filename + '?run=' +
        encodeURIComponent(code).replace(/%20/g, '+').replace(/%0A/g, '|')
        .replace(/%2C/g, ','));
  }
}

function defaultDirSortingByDate() {
  if (!specialowner()) return false;
  try {
    if (!window.localStorage) return false;
    return window.localStorage.dirsort === 'bydate';
  } catch(e) {
    return false;
  }
}

function setDefaultDirSortingByDate(f) {
  try {
    if (f) {
      window.localStorage.dirsort = 'bydate';
    } else {
      delete window.localStorage['dirsort'];
    }
  } catch(e) {
  }
}

function createNewFileIntoPosition(position, filename, text) {
  var pane = paneatpos(position);
  var mpp = model.pane[pane];
  if (!text) { text = ''; }
  view.clearPane(pane, false);
  mpp.loading = 0;
  mpp.filename = filename;
  mpp.isdir = false;
  mpp.bydate = false;
  mpp.data = {
    file: filename,
    data: text,
    mtime: 0
  };
  view.setPaneEditorText(pane, text, filename);
  view.notePaneEditorCleanText(pane, '');
  mpp.running = false;
}


function loadFileIntoPosition(position, filename, isdir, forcenet, cb) {
  var pane = paneatpos(position);
  var mpp = model.pane[pane];
  var loadNum = nextLoadNumber();
  // Now if the file or owner are different from what is currently shown,
  // update the model and execute the load.
  if (mpp.filename === filename && !forcenet) {
    cb && cb();
  } else {
    view.clearPane(pane, true); // show loading animation.
    mpp.filename = filename;
    mpp.isdir = isdir;
    mpp.bydate = isdir && defaultDirSortingByDate();
    mpp.loading = loadNum;
    mpp.data = null;
    mpp.running = false;
    storage.loadFile(model.ownername, filename, forcenet, function(m) {
      if (mpp.loading != loadNum) {
        if (window.console) {
          window.console.log('aborted: loading is ' +
              mpp.loading + ' instead of ' + loadNum);
        }
        return;
      }
      mpp.loading = 0;
      if (model.ownername === '' && filename === '') {
        mpp.isdir = true;
        mpp.data = m;
        renderDirectory(posofpane(pane));
        cb && cb();
      } else if (m.directory && m.list) {
        // Directory listing.
        mpp.isdir = true;
        mpp.data = m;
        renderDirectory(posofpane(pane));
        cb && cb();
      } else if (!m.data && m.newfile) {
        // In the nofile case, create an empty file.
        createNewFileIntoPosition('left', filename);
        updateTopControls(false);
        view.flashNotification('New file ' + filename + '.');
        cb && cb();
      } else {
        // The single file case.
        // TODO:
        // 2. in the offline case, notify the user that we are working offline.
        // 3. in the unsaved case, notify the user that we loaded a backup and
        //    give a link to load from network.
        if (!m.data) { m.data = ''; }
        mpp.isdir = false;
        mpp.data = m;
        view.setPaneEditorText(pane, m.data, filename);
        noteIfUnsaved(posofpane(pane));
        updateTopControls(false);
        cb && cb();
      }
    });
  }
};

function sortByDate(a, b) {
  return b.mtime - a.mtime;
}

function renderDirectory(position) {
  var pane = paneatpos(position);
  var mpp = model.pane[pane];
  var m = mpp.data;
  var filename = mpp.filename;
  var filenameslash = filename.length ? filename + '/' : '';
  // TODO: fix up visible URL to ensure slash.
  var links = [];
  for (var j = 0; j < m.list.length; ++j) {
    var label = m.list[j].name;
    if (model.ownername === '' && filename === '') {
      if (m.list[j].mode.indexOf('d') < 0) { continue; }
      var href = '//' + label + '.' + window.pencilcode.domain + '/edit/';
      links.push({html:label, href:href, mtime:m.list[j].mtime});
    } else {
      if (m.list[j].mode.indexOf('d') >= 0) { label += '/'; }
      var href = '/home/' + filenameslash + label;
      links.push({html:label, link:label, href:href, mtime:m.list[j].mtime});
    }
  }
  if (mpp.bydate) {
    links.sort(sortByDate);
  }
  if (model.ownername !== '') {
    links.push({html:''});
    links.push({html:'<span class="create">Create new file</span>',
        link:'#new'});
  }
  view.setPaneLinkText(pane, links, filename);
  updateTopControls(false);
}

//
// Returns text content of the editor
// or null if there's no file loaded.
//

function getEditTextIfAny() {
  var m = modelatpos('left');
  if (m.filename && m.data && m.data.file) {
    var text = view.getPaneEditorText(paneatpos('left'));
    return (text && text.text && text.text.trim())
  }
  return null;
}

function shortenUrl(url, cb) {
  var reqObj = {
    dataType: 'json',
    // type: 'POST',
    url: 'https://www.googleapis.com/urlshortener/v1/url?' +
         'key=AIzaSyCSnpkwynMDLa7h_lkx4r7QDb2sjqdrFTo',
    header: 'Content-Type: application/json',
    data: JSON.stringify({longUrl: url})
  };
  var reqStr =
      '//jsonlib.appspot.com/fetch?' + escape(JSON.stringify(reqObj));

  // If the request length is longer than 2048, it is not going to succeed.
  if (reqStr.length <= 2048) {
    $.getJSON('http://call.jsonlib.com/fetch', reqObj,
        function(m) {
          if (!m.content) { cb(null); return; }
          var content;
          try {
            content = JSON.parse(m.content);
          } catch(e) {
            cb(null); return;
          }
          cb(content.id);
        }).error(function() { cb(null) });
  } else {
    cb(null);
  }
}

function cookie(key, value, options) {
  // write
  if (value !== undefined) {
    options = $.extend({}, options);

    if (typeof options.expires === 'number') {
      var days = options.expires, t = options.expires = new Date();
      t.setDate(t.getDate() + days);
    }

    return (document.cookie = [
      encodeURIComponent(key),
      '=',
      encodeURIComponent(value),
      options.expires ? '; expires=' + options.expires.toUTCString() : '',
      options.path    ? '; path=' + options.path : '',
      options.domain  ? '; domain=' + options.domain : '',
      options.secure  ? '; secure' : ''
    ].join(''));
  }

  // read
  var decode = function(s) {
     try {
        return decodeURIComponent(s.replace(/\+/g, ' '));
     } catch (e) {
       return '';
     }
  }
  var converted = function(s) {
    if (s.indexOf('"') === 0) {
      s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    return s;
  }
  var cookies = document.cookie.split('; ');
  var result = key ? undefined : {};
  for (var i = 0, l = cookies.length; i < l; i++) {
    var parts = cookies[i].split('=');
    var name = decode(parts.shift());
    var cookie = decode(parts.join('='));
    if (key && key === name) {
      result = converted(cookie);
      break;
    }
    if (!key && parts.length) {
      result[name] = converted(cookie);
    }
  }
  return result;
};

///////////////////////////////////////////////////////////////////////////
// CROSS-FRAME-MESSAGE SUPPORT
///////////////////////////////////////////////////////////////////////////

// parses window.location.hash params into a dict
function parseWindowLocationHash() {
  // This is more consistent that window.location.hash because
  // Firefox partially uri-decodes window.location.hash.
  var hash = window.location.href.indexOf('#') < 0 ? '' :
      location.href.substring(window.location.href.indexOf('#'));

  if (!hash || hash.length < 2) {
    return {};
  }

  hash = hash.substring(1);
  var hashParts = hash.split('&');
  var hashDict = {};
  for (var i = 0; i < hashParts.length; i++) {
    if (hashParts[i].indexOf('=') === -1) {
      return {};
    }

    var separatorLocation = hashParts[i].indexOf('=');
    var key = hashParts[i].substring(0, separatorLocation);
    var value = hashParts[i].substring(separatorLocation + 1);
    try {
      value = decodeURIComponent(value);
    } catch (e) { }
    hashDict[key] = value;
  }

  return hashDict;
}

// extracts secret from the location hash
function getCrossFrameContext() {
  var hashDict = parseWindowLocationHash();
  if (!hashDict.secret) {
    return {secret: null};
  }
  return {secret: hashDict.secret}
}

// processes messages from other frames
$(window).on('message', function(e) {
  // parse event data
  try {
    var data = JSON.parse(e.originalEvent.data);
  } catch(error) {
    return false;
  }

  // check secret
  if (!data.secret || data.secret != model.crossFrameContext.secret) {
    return false;
  }

  // invoke the requested method
  switch (data.methodName) {
    case 'setCode':
      view.setPaneEditorText(
          paneatpos('left'), data.args[0], modelatpos('left').filename);
      break;
    case 'setupScript':
      model.setupScript = data.args[0];
      if (modelatpos('right').running) {
        // If we are currently showing a run pane, then reload it.
        var mimetext = view.getPaneEditorText(paneatpos('left'));
        var runtext = mimetext && mimetext.text;
        runCodeAtPosition('right', runtext, modelatpos('left').filename, true);
      }
      break;
    case 'eval':
      evalAndPostback(data.requestid, data.args[0]);
      break;
    case 'beginRun':
      view.run();
      break;
    case 'save':
      signUpAndSave({filename:data.args[0]});
      break;
    case 'hideEditor':
      view.hideEditor(paneatpos('left'));
      break;
    case 'showEditor':
      view.showEditor(paneatpos('left'));
      break;
    case 'hideMiddleButton':
      view.canShowMiddleButton = false;
      view.showMiddleButton('');
      break;
    case 'showMiddleButton':
      view.canShowMiddleButton = true;
      view.showMiddleButton('run');
      break;
    case 'setEditable':
      view.setPaneEditorReadOnly(paneatpos('left'), false);
      break;
    case 'setReadOnly':
      view.setPaneEditorReadOnly(paneatpos('left'), true);
      break;
    case 'showNotification':
      view.flashNotification(data.args[0]);
      break;
    case 'hideNotification':
      view.dismissNotification();
      break;
    default:
      return false;
  }

  return true;
});


// posts message to the parent window, which may have embedded us
function createMessageSinkFunction() {
  var noneMessageSink = function(method, args){};

  // check we do have a parent window
  if (window.parent === window) {
    return noneMessageSink;
  }

  // validate presence of secret in hash
  if (!model.crossFrameContext.secret) {
    return noneMessageSink;
  }

  return function(method, args, requestid){
    var payload = {
        methodName: method,
        args: args};
    if (requestid) {
      payload.requestid = requestid;
    }
    window.parent.postMessage(
        JSON.stringify(payload), '*');
  };
}

view.subscribe(createMessageSinkFunction());

function evalAndPostback(requestid, code) {
  var resultanderror = null;
  if (modelatpos('right').running) {
    resultanderror = view.evalInRunningPane(paneatpos('right'), code);
  } else {
    resultanderror = [null, 'error: not running'];
  }
  view.publish("response", resultanderror, requestid);
}

// For a hosting frame, publish the 'load' event before publishing
// the first 'update' events.
view.publish('load');

readNewUrl();

return model;

});
