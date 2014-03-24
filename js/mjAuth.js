/*  mjAuth.js  */

/* Parse query parameter style name/value pairs into an associative array,
	(IOW a simple Javascript object)
*/
function parseParams(paramStr) {
	if (!paramStr)
		return {};
	var map = {};
	var arr = paramStr.split('&');
	for (var spl, i = 0; i < arr.length; i++) {
		spl = arr[i].split('=');
		map[spl[0]] = decodeURIComponent(spl[1]);
	}
	return map;
}


var authModule = angular.module('authModule', []);

authModule.factory('authenticator', function(){
	var auth = {
		authorityUrl:	null,
		authorityError:	null,
		accessToken:	null,
		meUri:			null,
		homeUri:		null,

		/* change who the authentication authority is */
		setAuthority: function(authUrl) {
			auth.authorityUrl = authUrl;
			auth.authorityError = null;
		},
		
		/* perform an authentication using the currently configured authority */
		authenticate: function() {
			if (auth.authorityError || !auth.authorityUrl)
				return;
			
			var baseUrl = window.location.href;
			baseUrl = /^([^#]*)/.exec(baseUrl)[1]; // the location without the hash

			console.log('reauthenticating...');
			var redirUrl = auth.authorityUrl
				+ '/oauth/authorize?response_type=token&client_id=X2nbuI4GnGQ9&redirect_uri='
				+ encodeURIComponent(baseUrl) + '&state=' + encodeURIComponent(auth.authorityUrl);
				
			window.location = redirUrl;
		},
		
		/* do this on entry to the app */
		checkOnEntry: function() {
			// Check if we are receiving a return redirection that contains access info in the hash tag
			var hash = window.location.hash;
			if (hash) {
				var params = parseParams(hash.replace(/^\#/,''));
				
				if (params.error) {
					auth.authorityError = params.error;
					return;
				}

				var token = params.access_token;
				if (token) {
					auth.accessToken = token;
					auth.meUri = params.userId;
					auth.homeUri = params.communityId;
					auth.authorityUrl = params.state;
					
					var cookieScope = {expires: 365, path: '/'};
					$.cookie('mjDemoAccessToken', token,             cookieScope);
					$.cookie('mjDemoMeId',        auth.meUri,        cookieScope);
					$.cookie('mjDemoHomeId',      auth.homeUri,      cookieScope);
					$.cookie('mjDataSource',      auth.authorityUrl, cookieScope);
					
					// hide the auth info by navigating to the same URL without the hash tag
					window.location.hash = null;
					return;
				}
			}
			
			// Look for access info in cookies
			auth.accessToken = $.cookie('mjDemoAccessToken');
			auth.meUri = $.cookie('mjDemoMeId');
			auth.homeUri = $.cookie('mjDemoHomeId');
			auth.authorityUrl = $.cookie('mjDataSource');

			// If nothing in the cookies, gotta authenticate now
			if ((!auth.accessToken || !auth.meUri) && auth.authorityUrl) {
				auth.authenticate();
			}
		}
	};
	
	return auth;
});

authModule.run(function(authenticator) {
	authenticator.checkOnEntry();
});
