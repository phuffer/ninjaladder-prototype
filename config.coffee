module.exports = config:
  paths:
    "watched": ["client", "vendor"]
    "public": "public"
  files:
    javascripts:
      joinTo:
        'js/client.js': /^client/
        'js/vendor.js': /^vendor/

      order:
        before: [
          'vendor/phaser.js',
        ]

    stylesheets: joinTo: 'styles/client.css'

  server:
    path: './server/httpServer.js'
    run: yes
    port: 9192

  plugins:
    autoReload:
      port: 9193
    uglify:
      mangle: false
