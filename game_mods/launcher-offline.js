/**
 * 🏰 MQEL Offline Launcher.js
 * Modified version for offline play with Supabase backend
 */

var _proxy;
var launcherWeb;

// ========================================
// OFFLINE SERVER CONFIGURATION
// ========================================
var OFFLINE_CONFIG = {
    serverUrl: 'http://localhost:3000',
    supabaseUrl: 'https://fsrfzdbmpywtsifmlria.supabase.co',
    version: '0.36.1.34.0-offline'
};

function ClientProxy() {
    this.offlineMode = true;
}

$.extend(ClientProxy.prototype, {
    _triggerHideLaunchButton: function() { $(this).trigger('hideLaunchButton'); },
    _triggerLoadLoginPage: function(params) { $(this).trigger('loadLoginPage', params); },
    _triggerHideProgressionBar: function() { $(this).trigger('hideProgressbar'); },
    _triggerShowMessageBox: function(options) { $(this).trigger('showMessageBox', options); },
    _triggerProgressionChange: function(progression) { $(this).trigger('progressionChange', progression); },
    _triggerShowLaunchButton: function() { $(this).trigger('showLaunchButton'); },
    _triggerShowProgressionBar: function() { $(this).trigger('showProgressbar'); },
    _triggerVersionNumberChange: function(version) { $(this).trigger('versionNumberChange', version); },
    
    submitFormWithSteamTicket: function(steamTicket) { 
        console.log('[OFFLINE] Skipping Steam ticket validation');
        launcherWeb.offlineLogin();
    }
});

function LauncherWeb(proxy) {
    this.proxy = proxy;
    this.offlineToken = null;
    
    LauncherWeb.log("init - OFFLINE MODE");
    this.initProgressbar();
    this.initMessageBox();
    this.bindProxy();
    this.bindButtons();
    this.initOfflineMode();
}

$.extend(LauncherWeb.prototype, {

    REMOTE_LANG_COOKIE: "launcher_locale",
    _version: {TextID: null, TextParams: null},
    
    initProgressbar: function() {
        $("#progressbar").progressbar();
    },

    initMessageBox: function() {
        this.$messageBox = $('<div id="message-box"></div>');
        this.$messageBox.dialog({
            autoOpen: false,
            closeOnEscape: false,
            open: this._hideMessageBoxCloseButton
        });
    },

    initOfflineMode: function() {
        LauncherWeb.log('[OFFLINE] Initializing offline mode...');
        this.checkServerStatus();
        this.versionNumberChange(null, {
            TextID: 55,
            TextParams: [OFFLINE_CONFIG.version]
        });
    },

    checkServerStatus: function() {
        var self = this;
        $.ajax({
            url: OFFLINE_CONFIG.serverUrl + '/api/health',
            method: 'GET',
            timeout: 3000,
            success: function(data) {
                LauncherWeb.log('[OFFLINE] Server is running');
                self.showOfflineLoginUI();
            },
            error: function() {
                LauncherWeb.log('[OFFLINE] Server not running');
                self.showServerError();
            }
        });
    },

    showOfflineLoginUI: function() {
        $('#remote-launcher-pages').hide();
        $('#offline-login').show();
        $('#launch-button').show().removeClass('disabled');
    },

    showServerError: function() {
        this.showMessageBox(null, {
            TitleTextID: 'Server Offline',
            InfoTextID: 'Le serveur local n\'est pas d\u00e9marr\u00e9. Lancez server-v2.js d\'abord!',
            ButtonTextIDs: ['OK']
        });
    },

    offlineLogin: function() {
        var self = this;
        var email = $('#offline-email').val() || 'player@offline.local';
        var password = $('#offline-password').val() || 'offline123';

        LauncherWeb.log('[OFFLINE] Attempting login for: ' + email);

        $.ajax({
            url: OFFLINE_CONFIG.serverUrl + '/api/auth/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ email: email, password: password }),
            success: function(response) {
                LauncherWeb.log('[OFFLINE] Login successful');
                self.offlineToken = response.token;
                document.cookie = 't=' + response.token + ';path=/';
                document.cookie = 'offline_mode=true;path=/';
                
                if (typeof _launcher !== 'undefined') {
                    _launcher._onUserLoggedIn(JSON.stringify({
                        LoginToken: response.token,
                        SGToken: 'offline-session',
                        UserEmail: email
                    }));
                }
                self.showLaunchButton();
            },
            error: function(xhr) {
                LauncherWeb.log('[OFFLINE] Login failed: ' + xhr.responseText);
                self.showMessageBox(null, {
                    TitleTextID: 'Login Failed',
                    InfoTextID: 'Erreur de connexion.',
                    ButtonTextIDs: ['OK']
                });
            }
        });
    },

    bindButtons: function() {
        var self = this;
        $("#close-launcher-button").click(this.exitApplication);
        $("#launch-button").click(function() {
            if (!$(this).hasClass('disabled')) {
                self.launchGame();
            }
        });
        $(document).on('click', '#offline-login-btn', function() {
            self.offlineLogin();
        });
        $(document).on('click', '#quick-play-btn', function() {
            self.quickPlay();
        });
    },

    quickPlay: function() {
        var self = this;
        var randomId = Math.random().toString(36).substring(7);
        var email = 'player_' + randomId + '@offline.local';
        
        $.ajax({
            url: OFFLINE_CONFIG.serverUrl + '/api/auth/register',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ 
                email: email, 
                password: 'quickplay',
                display_name: 'Hero_' + randomId.toUpperCase()
            }),
            success: function(response) {
                $('#offline-email').val(email);
                $('#offline-password').val('quickplay');
                self.offlineLogin();
            },
            error: function(xhr) {
                LauncherWeb.log('[OFFLINE] Quick play failed');
            }
        });
    },

    bindProxy: function() {
        $(this.proxy).on({
            hideLaunchButton: $.proxy(this.hideLaunchButton, this),
            hideProgressbar: $.proxy(this.hideProgressbar, this),
            loadLoginPage: $.proxy(this.loadLoginPage, this),
            progressionChange: $.proxy(this.progressionChange, this),
            showLaunchButton: $.proxy(this.showLaunchButton, this),
            showMessageBox: $.proxy(this.showMessageBox, this),
            showProgressbar: $.proxy(this.showProgressbar, this),
            versionNumberChange: $.proxy(this.versionNumberChange, this)
        });
    },

    exitApplication: function() {
        if (typeof _launcher !== 'undefined') {
            _launcher._triggerExitApplication('');
        }
    },

    launchGame: function() {
        if ($("#launch-button").hasClass('disabled')) { return; }
        LauncherWeb.log("[OFFLINE] Launching game...");
        if (typeof _launcher !== 'undefined') {
            _launcher._onLaunchButtonClicked('');
        }
    },

    hideLaunchButton: function() { $('#launch-button').hide(); },
    hideProgressbar: function() { $('#progressbar').hide(); },
    loadLoginPage: function() { this.showOfflineLoginUI(); },
    progressionChange: function(event, progression) {
        $('#progressbar').progressbar('value', progression.Progress);
        $('#progression-text').html(progression.TextID);
    },
    showLaunchButton: function() { $('#launch-button').show().removeClass('disabled'); },
    showMessageBox: function(event, options) {
        var self = this;
        var buttons = {};
        if (options.ButtonTextIDs) {
            $.each(options.ButtonTextIDs, function(i, text) {
                buttons[text] = function() { self.$messageBox.dialog("close"); };
            });
        }
        this.$messageBox.html(options.InfoTextID);
        this.$messageBox.dialog('option', { "title": options.TitleTextID, "buttons": buttons });
        this.$messageBox.dialog('open');
    },
    showProgressbar: function() { $('#progressbar').show(); },
    versionNumberChange: function(event, version) {
        this._version = version;
        $('.version-label').html('MQEL Offline v' + OFFLINE_CONFIG.version);
    },
    _hideMessageBoxCloseButton: function() {
        $(this).parent().children().children('.ui-dialog-titlebar-close').hide();
    }
});

LauncherWeb.log = function(message) {
    console.log('[MQEL] ' + message);
    if (typeof _launcher !== "undefined") {
        _launcher._triggerLog(message);
    }
};

$(function() {
    if (typeof I18n !== 'undefined') { I18n.currentLanguage = 'fr'; }
    _proxy = new ClientProxy();
    launcherWeb = new LauncherWeb(_proxy);
});