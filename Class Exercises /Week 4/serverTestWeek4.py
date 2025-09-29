from flask import Flask, render_template

app = Flask(__name__)
@app.route("/")
def index():
    return render_template("pineapples.html")

@app.route("/another")
def another():
    return render_template("pineapples_two.html")

@app.route("/three")
def three():
    someNewVar = "strawberries"
    someNewList = ["one", "two", "three"]
    someDict = {"color": "yellow", "feature": "spiky", "taste": "sweet"}
    return render_template("pineapples_three.html", 
                           someHTMLVar = someNewVar,
                           someHTMLList = someNewList,
                           someHTMLDict = someDict)
@app.route("/four")
def four():
    userLoggedIn = True
    a_new_list = [1,2,3,4,5]
    b_new_list = ["blue", "red", "cyan", "magenta", "purple"]
    return render_template("pineapples_four.html", 
                           a_HTML_list = a_new_list,
                           b_HTML_list = b_new_list,
                           userLoggedInHTML = userLoggedIn)

app.run(debug=True)
