from flask import Flask

app = Flask(__name__)

@app.route("/")
def index():
    return "<h1> Hello, CART 351! </h1>"

@app.route("/about")
def about():
    return '<h1 style = "color:blue"> About CART 351 </h1>'

@app.route("/user/<name>")
def user_profile(name):
    return f"<h2> This is <span style = 'color: orange'> {name}'s </span> profile page</h2>"

@app.route("/another/<dynamicVar>")
def another_route(dynamicVar):
    if dynamicVar[-1] != 'y' :
        return f"<h2> {dynamicVar}y </h2>"
    else:
        return f"<h2> {dynamicVar}iful </h2>"

app.run(debug=True)


