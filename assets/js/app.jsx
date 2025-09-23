var React = require('react')
var auth = require('./auth')

module.exports = React.createClass({
   getInitialState: function() {
        return {'user':[]}
    },

    componentDidMount: function() {
        this.loadUserData()
    },
            
    contextTypes: {
        router: React.PropTypes.object.isRequired
    },

    logoutHandler: function() {
        auth.logout()
        this.context.router.replace('/app/login/')
    },

    loadUserData: function() {
        $.ajax({
            method: 'GET',
            url: '/api/users/i/',
            datatype: 'json',
            headers: {
                'Authorization': 'Token ' + localStorage.token
            },
            success: function(res) {
                this.setState({user: res})
            }.bind(this)
        })
    },

    render: function() {
        return (
            <div>
            <h1>You are now logged in, {this.state.user.username}</h1>
            <button onClick={this.logoutHandler}>Log out</button>

            <hr/>
            <h2>Upload CSV / Excel</h2>
            <form onSubmit={this.handleUpload} encType="multipart/form-data">
                <input type="file" ref="file" accept=".csv,.xls,.xlsx" />
                <input type="submit" value="Upload" />
            </form>
            {this.state.uploadMessage ? <p>{this.state.uploadMessage}</p> : null}
            </div>
        )        
    }

    ,
    handleUpload: function(e) {
        e.preventDefault()
        var fileInput = this.refs.file
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            this.setState({uploadMessage: 'Please choose a file to upload.'})
            return
        }
        var file = fileInput.files[0]

        var formData = new FormData()
        formData.append('file', file)

        $.ajax({
            url: '/api/upload-file/',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            headers: {
                'Authorization': 'Token ' + localStorage.token
            },
            success: function(res) {
                this.setState({uploadMessage: 'Upload successful: ' + (res.filename || '')})
            }.bind(this),
            error: function(xhr) {
                var msg = 'Upload failed.'
                try { msg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : msg } catch(e){}
                this.setState({uploadMessage: msg})
            }.bind(this)
        })
    }
})
