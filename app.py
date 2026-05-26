from flappy import create_app

app = create_app("development")

if __name__ == "__main__":
    # The dev server. In production, a WSGI server (gunicorn) calls
    # create_app() directly and this block is never reached.
    app.run(debug=True, host="0.0.0.0", port=5000)