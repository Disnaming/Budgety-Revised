var budgetController = (function() {
    
    var Expense = function(id, desc, value) {
        this.id    = id;
        this.desc  = desc;
        this.value = value;
        this.percentage = -1;
    }

    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome != 0) {
            this.percentage = this.value / totalIncome;
        } else {
            this.percentage = -1;
        }
    }

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    var Income = function(id, desc, value) {
        this.id    = id;
        this.desc  = desc;
        this.value = value;
    }

    var calculateTotal = function(type) {
        var sum = 0;
        data.items[type].forEach(function(cur) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    }

    var data = {
        items: {
            inc: [],
            exp: [],
        },
        totals: {
            inc: 0,
            exp: 0,
        },
        budget: 0,
        percentage: 0
    }

    return {
        addItem: function(type, desc, val) {

            var ID;
            if (data.items[type].length > 0) {
                ID = data.items[type][data.items[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            var newItem = null;
            if (type === 'inc') {
                newItem = new Income(ID, desc, val);
            } else if (type === 'exp') {
                newItem = new Expense(ID, desc, val);
            }
            data.items[type].push(newItem);
            return newItem;
        },

        deleteItem: function(type, ID) {
            let ids = data.items[type].map(function(current) {
                return current.id;
            });
            index = ids.indexOf(ID);
            data.items[type].splice(index, 1);
        },

        test: function() {
            console.log(data);
        },

        calculateBudget: function() {
            calculateTotal('inc');
            calculateTotal('exp');
            data.budget = data.totals['inc']-data.totals['exp'];
            if (data.totals['inc'] !== 0) {
                data.percentage = data.totals['exp']/data.totals['inc'];
            } else {
                data.percentage = -1;
            }
            
        },

        getBudget: function() {
            return {
                budget: data.budget,
                income: data.totals['inc'],
                expense: data.totals['exp'],
                percentage: data.percentage
            }
        },

        computePercentages: function() {
            data.items.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function() {
            var percentages = data.items.exp.map(function(cur) {
                return cur.getPercentage();
            });
            return percentages;
        }
    }

})();

var UIController = (function() {

    var DOMstrings = {
        inputType: '.add__type',
        inputDesc: '.add__description',
        inputVal:  '.add__value',
        inputAdd:  '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        budgetLabel: '.budget__value',
        percentLabel: '.budget__expenses--percentage',
        container: '.container',
        itemPercLabel: '.item__percentage',
        monthLabel: '.budget__title--month'

    }

    var formatNumber = function(num, type) {
        num = Math.abs(num);
        var splitNum = num.toFixed(2);
        var commaNum = splitNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return (type === 'inc' ? '+' : '-') + ' ' + commaNum;
    }

    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    }

    return {
        getInput: function() {
            // read data
            var type = document.querySelector(DOMstrings.inputType).value;
            var desc = document.querySelector(DOMstrings.inputDesc).value;
            var val  = parseFloat(document.querySelector(DOMstrings.inputVal ).value);
            return {
                type:  type,
                desc:  desc,
                value: val
            }
        },

        getDOMstrings: function() {
            return DOMstrings;
        },

        displayInput: function(item, type) {
            var html, element;
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = 
                `<div class="item clearfix" id="inc-%id%">
                    <div class="item__description">%desc%</div>
                    <div class="right clearfix">
                        <div class="item__value">%value%</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`;
            } else {
                element = DOMstrings.expensesContainer;
                html = 
                `<div class="item clearfix" id="exp-%id%">
                    <div class="item__description">%desc%</div>
                    <div class="right clearfix">
                        <div class="item__value">%value%</div>
                        <div class="item__percentage">%percentage%</div>
                        <div class="item__delete">
                            <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button>
                        </div>
                    </div>
                </div>`;
            }

            html = html.replace('%id%', item.id);
            html = html.replace('%desc%', item.desc);
            html = html.replace('%value%', formatNumber(item.value, type));
            html = html.replace('%percentage%', '0%');
            document.querySelector(element).insertAdjacentHTML("beforeend", html);

        },

        resetFields: function() {
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDesc + ", " + DOMstrings.inputVal);
            fieldsArr = Array.prototype.slice.call(fields);
            fieldsArr.forEach(function(cur, index, arr) {
                cur.value = "";
            });
            fieldsArr[0].focus();
        },

        updateInterface: function(vals) {
            document.querySelector(DOMstrings.budgetLabel).textContent = vals.budget;
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(vals.income, 'inc');
            document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber(vals.expense, 'exp');
            if (vals.percentage > 0) {
                document.querySelector(DOMstrings.percentLabel).textContent = Math.round(vals.percentage * 100) + '%';
            } else {
                document.querySelector(DOMstrings.percentLabel).textContent = '---%';
            }
        },

        deleteListItem: function(selectorID) {
            let selector = document.getElementById(selectorID);
            selector.parentNode.removeChild(selector); // should have deleted the HTML
        },

        updatePercentages: function(arr) {
            // using percentages array, update UI elements
            // iterate over expense elements
            var el = DOMstrings.itemPercLabel;
            var fields = document.querySelectorAll(el);

            nodeListForEach(fields, function(current, index) {
                if (arr[index] != -1) {
                    current.textContent = Math.round(arr[index] * 100) + '%';
                } else {
                    current.textContent = '---%';
                }
            });

        },

        displayMonth: function() {
            var now = new Date();
            var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var year = now.getFullYear();
            var month = now.getMonth();
            document.querySelector(DOMstrings.monthLabel).textContent = months[month] + ", " + year;
        },

        changeType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDesc + ',' +
                DOMstrings.inputVal
            );
            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });
            document.querySelector(DOMstrings.inputAdd).classList.toggle('red');
        }
    }

})();

var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();
        document.querySelector(DOM.inputAdd).addEventListener('click', function() { ctrlAddItem(); } );
        document.addEventListener('keypress', function(event) {
            if (event.keyCode === 13) {
                ctrlAddItem();
            }});    
        document.querySelector(DOM.container).addEventListener('click', function() {ctrlDeleteItem(event);});
        document.querySelector(DOM.inputType).addEventListener('change', function() {UICtrl.changeType();});
    }

    var updatePercentages = function() {
        budgetCtrl.computePercentages();
        // compute percentages
        var percentages = budgetCtrl.getPercentages();
        // get percentages
        UICtrl.updatePercentages(percentages);
        // display percentages
    }

    var updateBudget = function() {
        var vals;
        // calculate the budget
        budgetCtrl.calculateBudget();
        // return the budget
        vals = budgetCtrl.getBudget();
        // display the budget
        UICtrl.updateInterface(vals);
    }

    var ctrlAddItem = function() {
        var input, item;
        input = UICtrl.getInput();
        if (input.desc != "" && !isNaN(input.value) && input.value != 0) {
            item = budgetCtrl.addItem(input.type, input.desc, input.value);
            UICtrl.displayInput(item, input.type);
            UICtrl.resetFields();
            updateBudget();
            updatePercentages();
        }
    }

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;

        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if (itemID) {
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);
            budgetCtrl.deleteItem(type, ID);
            UICtrl.deleteListItem(itemID);
            updateBudget(itemID);
            updatePercentages();
        }


    }



    return {
        init: function() {
            console.log("Application has started");
            setupEventListeners();
            UICtrl.updateInterface({
                budget: 0,
                income: 0,
                expense: 0,
                percentage: -1
            });
            UICtrl.displayMonth();
            console.log("Application has been initialized");

        }
    }
})(budgetController, UIController);

controller.init();