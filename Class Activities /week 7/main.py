from flask import Flask, render_template, request
app = Flask(__name__)

@app.route('/')
def default():
    return render_template('base.html')

@app.route('/index')
def index():
    passedDictionary={"fav_color":"fuscia", "fav_veg":"cauliflower","fav_fruit":"kiwi", "fav_animal":"toucan"}
    return render_template("index.html", user={"username":"maia"}, passedDictionary = passedDictionary, imgPath="img1.jpg")

@app.route('/pineParent')
def pineParent():
    return render_template("pineAppleParent.html")

@app.route('/about')
def about():
    return render_template("pineAppleChild.html", 
                           dataPassedA = "child A!")



@app.route("/addPlantData")
def addPlantData():
    return render_template("addPlantData.html")

@app.route("/thank_you")
def thank_you():
    app.logger.info(request.args)
    return render_template("thankyou.html", owner_name=request.args["o_name"])





app.run(debug=True)