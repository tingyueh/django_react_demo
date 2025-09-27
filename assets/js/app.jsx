var React = require('react')
var auth = require('./auth')

var styles = {
    page: {
        minHeight: '100vh',
        margin: 0,
        padding: '40px 16px',
        background: '#f4f6fb',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: '"Segoe UI", Arial, sans-serif'
    },
    card: {
        width: '100%',
        maxWidth: '540px',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 18px 40px rgba(15, 24, 44, 0.12)',
        padding: '36px 42px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px'
    },
    welcome: {
        margin: 0,
        color: '#1f2937',
        fontSize: '26px',
        fontWeight: 600
    },
    helperText: {
        margin: '6px 0 0',
        color: '#6b7280',
        fontSize: '14px'
    },
    logoutButton: {
        border: 'none',
        background: '#e11d48',
        color: '#ffffff',
        padding: '10px 18px',
        borderRadius: '999px',
        cursor: 'pointer',
        fontWeight: 600
    },
    sectionTitle: {
        margin: '0 0 16px',
        fontSize: '18px',
        color: '#111827'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    fileInput: {
        padding: '12px',
        border: '1px solid #d1d5db',
        borderRadius: '10px',
        background: '#f9fafb'
    },
    submitButton: {
        border: 'none',
        background: '#2563eb',
        color: '#ffffff',
        padding: '12px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 600,
        letterSpacing: '0.02em'
    },
    divider: {
        border: 0,
        borderTop: '1px solid #e5e7eb',
        margin: '28px 0'
    },
    messageHidden: {
        display: 'none'
    },
    messageSuccess: {
        margin: '4px 0 0',
        padding: '10px 14px',
        background: 'rgba(59, 130, 246, 0.15)',
        color: '#1d4ed8',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500
    },
    messageError: {
        margin: '4px 0 0',
        padding: '10px 14px',
        background: 'rgba(220, 38, 38, 0.15)',
        color: '#b91c1c',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 500
    },
    compiledBox: {
        marginTop: '16px',
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        background: '#f9fafb'
    },
    codeBlock: {
        margin: '12px 0 0',
        padding: '12px',
        borderRadius: '8px',
        background: '#1f2937',
        color: '#f9fafb',
        fontFamily: '"Fira Code", "SFMono-Regular", Consolas, monospace',
        fontSize: '13px',
        overflowX: 'auto'
    },
    metaText: {
        marginTop: '8px',
        color: '#4b5563',
        fontSize: '13px'
    },
    previewSection: {
        marginTop: '16px',
        padding: '16px',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        background: '#f8fafc'
    },
    previewActions: {
        display: 'flex',
        gap: '12px',
        flexWrap: 'wrap'
    },
    secondaryButton: {
        border: '1px solid #2563eb',
        background: '#ffffff',
        color: '#2563eb',
        padding: '10px 16px',
        borderRadius: '10px',
        cursor: 'pointer',
        fontWeight: 600
    },
    previewTable: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '12px'
    },
    previewTh: {
        textAlign: 'left',
        padding: '8px',
        borderBottom: '1px solid #e5e7eb',
        fontWeight: 600,
        color: '#1f2937'
    },
    previewTd: {
        padding: '8px',
        borderBottom: '1px solid #f1f5f9',
        fontSize: '13px',
        color: '#374151'
    }
}

module.exports = React.createClass({
   getInitialState: function() {
        return {
            user: {}, 
            uploadMessage: null, 
            messageTone: 'success',
            // 'success' or 'error'
            fileId: null,            // ⬅️ 保存后端返回的 file_id
            nl: '',                  // 自然语言描述
            compiled: null,          // {pattern, flags, explanations}
            columns: '',             // 目标列，逗号分隔，可留空=自动推断
            replacement: '',         // 替换文本
            preview: null            // 预览结果 {hit_count, columns, preview}
        }
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
                if (this.refs.file) this.refs.file.value = ''
                var nextState = {
                    user: res || {},
                    fileId: res && res.file_id ? res.file_id : null
                }
                if (res && res.filename) {
                    nextState.uploadMessage = 'Upload successful: ' + res.filename
                    nextState.messageTone = 'success'
                }
                this.setState(nextState)
                }.bind(this),
        })
    },

    render: function() {
        var username = this.state.user.username || 'there'
        var messageStyle = styles.messageHidden
        if (this.state.uploadMessage) {
            messageStyle = this.state.messageTone === 'error' ? styles.messageError : styles.messageSuccess
        }
        var compiled = this.state.compiled
        var hasCompiled = compiled && compiled.pattern
        var compiledFlags = hasCompiled && compiled.flags && compiled.flags.length ? compiled.flags.join(', ') : 'None'
        var preview = this.state.preview
        var previewRows = preview && preview.preview ? preview.preview : []
        var previewColumns = previewRows.length ? Object.keys(previewRows[0]) : []

        return (
            <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <div>
                        <h1 style={styles.welcome}>Welcome, {username}</h1>
                        <p style={styles.helperText}>Upload your latest CSV or Excel file below.</p>
                    </div>
                    <button type="button" onClick={this.logoutHandler} style={styles.logoutButton}>Log out</button>
                </div>

                <hr style={styles.divider} />

                <section>
                    <h2 style={styles.sectionTitle}>Upload a dataset</h2>
                    <form style={styles.form} onSubmit={this.handleUpload} encType="multipart/form-data">
                        <input style={styles.fileInput} type="file" ref="file" accept=".csv,.xls,.xlsx" />
                        <input style={styles.submitButton} type="submit" value="Upload" />
                    </form>
                    <p style={messageStyle}>{this.state.uploadMessage}</p>
                </section>
                <hr style={styles.divider} />

                <section>
                    <h2 style={styles.sectionTitle}>NL → Regex</h2>
                    <form style={styles.form} onSubmit={this.handleCompile}>
                      <input style={styles.fileInput} type="text" placeholder="Describe the pattern, e.g., Find email addresses in Email column"
                        value={this.state.nl} onChange={(e)=>this.setState({nl:e.target.value})}/>
                      <input style={styles.fileInput} type="text" placeholder="Target columns (comma-separated, optional)"
                        value={this.state.columns} onChange={(e)=>this.setState({columns:e.target.value})}/>
                      <input style={styles.submitButton} type="submit" value="Compile Regex" />
                    </form>
                    {hasCompiled ? (
                        <div style={styles.compiledBox}>
                            <div><strong>Pattern</strong></div>
                            <pre style={styles.codeBlock}>{compiled.pattern}</pre>
                            <div style={styles.metaText}><strong>Flags:</strong> {compiledFlags}</div>
                            {compiled.explanations ? (
                                <div style={styles.metaText}><strong>Explanation:</strong> {compiled.explanations}</div>
                            ) : null}
                            <div style={styles.previewSection}>
                                <div style={styles.metaText}><strong>Test &amp; Apply</strong></div>
                                <form style={styles.form} onSubmit={this.handleApply}>
                                    <input style={styles.fileInput} type="text" placeholder="Replacement text (optional)"
                                        value={this.state.replacement} onChange={(e)=>this.setState({replacement:e.target.value})}/>
                                    <div style={styles.previewActions}>
                                        <button type="button" onClick={this.handlePreview} style={styles.secondaryButton}>Preview</button>
                                        <input style={styles.submitButton} type="submit" value="Apply &amp; Download" />
                                    </div>
                                </form>
                                {preview ? (
                                    previewRows.length ? (
                                        <div>
                                            <div style={styles.metaText}><strong>Matches:</strong> {preview.hit_count}</div>
                                            <div style={styles.metaText}><strong>Columns:</strong> {preview.columns && preview.columns.length ? preview.columns.join(', ') : 'None'}</div>
                                            <table style={styles.previewTable}>
                                                <thead>
                                                    <tr>
                                                        {previewColumns.map(function(col) {
                                                            return <th key={col} style={styles.previewTh}>{col}</th>
                                                        })}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {previewRows.map(function(row, idx) {
                                                        return (
                                                            <tr key={idx}>
                                                                {previewColumns.map(function(col) {
                                                                    var cell = row[col]
                                                                    return <td key={col} style={styles.previewTd}>{cell}</td>
                                                                })}
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div style={styles.metaText}>Preview returned no sample rows.</div>
                                    )
                                ) : null}
                            </div>
                        </div>
                    ) : null}
                </section>
            </div>
            </div>
        )        
    }
    ,
    handleUpload: function(e) {
        e.preventDefault()
        var fileInput = this.refs.file
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            this.setState({uploadMessage: 'Please choose a file to upload.', messageTone: 'error'})
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
                if (this.refs.file) {
                    this.refs.file.value = ''
                }
                this.setState({uploadMessage: 'Upload successful: ' + (res.filename || file.name), messageTone: 'success'})
            }.bind(this),
            error: function(xhr) {
                var msg = 'Upload failed.'
                try { msg = xhr.responseJSON && xhr.responseJSON.error ? xhr.responseJSON.error : msg } catch(e){}
                this.setState({uploadMessage: msg, messageTone: 'error'})
            }.bind(this)
        })
    },
    handleCompile: function(e){
        e.preventDefault()
        if(!this.state.nl){ return this.setState({uploadMessage:'Please enter a description.', messageTone:'error'}) }
        $.ajax({
            url:'/api/llm/compile-regex/',
            type:'POST',
            headers:{ 'Authorization':'Token '+localStorage.token },
            contentType:'application/json',
            data: JSON.stringify({
                nl: this.state.nl,
                file_id: this.state.fileId,              // 可选，便于抽样
                sample_col: this.state.columns.split(',')[0] || null
            }),
            success: function(res){ this.setState({compiled: res}) }.bind(this),
            error: function(xhr){
                var msg = (xhr.responseJSON && xhr.responseJSON.error) || 'Compile failed'
                this.setState({uploadMessage: msg, messageTone:'error'})
            }.bind(this)
        })
    },

    handlePreview: function(e){
        e.preventDefault()
        if(!this.state.fileId || !this.state.compiled){ return this.setState({uploadMessage:'Upload & compile first.', messageTone:'error'}) }
        $.ajax({
            url:'/api/transform/preview/',
            type:'POST',
            headers:{ 'Authorization':'Token '+localStorage.token },
            contentType:'application/json',
            data: JSON.stringify({
            file_id: this.state.fileId,
            pattern: this.state.compiled.pattern,
            flags: this.state.compiled.flags || [],
            replacement: this.state.replacement,
            columns: this.state.columns ? this.state.columns.split(',').map(s=>s.trim()) : [],
            n: 20
            }),
            success: function(res){ this.setState({preview: res}) }.bind(this),
            error: function(xhr){
            var msg = (xhr.responseJSON && xhr.responseJSON.error) || 'Preview failed'
            this.setState({uploadMessage: msg, messageTone:'error'})
            }.bind(this)
        })
    },

    handleApply: function(e){
        e.preventDefault()
        if(!this.state.fileId || !this.state.compiled){ return this.setState({uploadMessage:'Upload & compile first.', messageTone:'error'}) }
        $.ajax({
            url:'/api/transform/apply/',
            type:'POST',
            headers:{ 'Authorization':'Token '+localStorage.token },
            contentType:'application/json',
            data: JSON.stringify({
                file_id: this.state.fileId,
                pattern: this.state.compiled.pattern,
                flags: this.state.compiled.flags || [],
                replacement: this.state.replacement,
                columns: this.state.columns ? this.state.columns.split(',').map(s=>s.trim()) : []
            }),
            success: function(res){
                this.setState({uploadMessage: 'Done! Download: '+res.download_url, messageTone:'success'})
            }.bind(this),
            error: function(xhr){
                var msg = (xhr.responseJSON && xhr.responseJSON.error) || 'Apply failed'
                this.setState({uploadMessage: msg, messageTone:'error'})
            }.bind(this)
        })
    },
})
