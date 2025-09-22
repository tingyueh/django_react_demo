module.exports = {
    login: function(username, pass, cb) {
        console.debug('auth.login called', {username: username, passLen: pass && pass.length})
        if (localStorage.token) {
            console.debug('auth.login: already have token')
            if (cb) cb(true)
            return
        }
        this.getToken(username, pass, (res) => {
            console.debug('auth.getToken callback', res)
            if (res.authenticated) {
                localStorage.token = res.token
                if (cb) cb(true)
            } else {
                if (cb) cb(false)
            }
        })
    },        
    
    logout: function() {
        delete localStorage.token
    },

    loggedIn: function() {
        return !!localStorage.token
    },

    getToken: function(username, pass, cb) {
        console.debug('auth.getToken sending request')
        $.ajax({
            type: 'POST',
            url: '/api/obtain-auth-token/',
            data: {
                username: username,
                password: pass
            },
            success: function(res){
                console.debug('auth.getToken success', res)
                cb({
                    authenticated: true,
                    token: res.token
                })
            },
            error: (xhr, status, err) => {
                console.debug('auth.getToken error', status, err, xhr && xhr.responseText)
                cb({
                    authenticated: false
                })
            }
        })
    }, 
}
