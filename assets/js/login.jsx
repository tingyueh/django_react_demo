var React = require('react')
var auth = require('./auth')

module.exports = React.createClass({
    contextTypes: {
        router: React.PropTypes.object.isRequired
    },
    
    getInitialState: function() {
        return {
          login_error: false
        }
      },

    handleSubmit: function(e) {
        e.preventDefault()

        console.debug('login.handleSubmit called')

        var username = this.refs.username.value
        var pass = this.refs.pass.value

        console.debug('login credentials', {username: username, pass: pass && pass.length})

        auth.login(username, pass, (loggedIn) => {
            if (loggedIn) {
                this.context.router.replace('/app/')
            } else {
                this.setState({login_error:true})
            }
        })
    },
    
    render: function() {
        return (
            <form onSubmit={this.handleSubmit}>
                <input type="text" placeholder="username" ref="username"/>
                <input type="password" placeholder="password" ref="pass"/>
                <input type="submit"/>
            </form>
        )    
    }
})

// The following lines are not part of the React component and should not be included in the final file.
// from django.contrib.auth.models import User
// u = User.objects.create_user('testuser','test@example.com','testpass123')
// u.save()
// exit()
