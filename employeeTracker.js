var mysql = require("mysql");
var inquirer = require("inquirer");

// create the connection information for the sql database
var connection = mysql.createConnection({
  host: "localhost",

  // Your port; if not 3306
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "yourRootPassword",
  database: "employeeTracker_DB",
});

// connect to the mysql server and sql database
connection.connect(function (err) {
  if (err) throw err;
  // run the start function after the connection is made to prompt the user
  runSearch();
});

const roleArr = ["Software Engineer", "QA Tester", "Sales Lead"];

function getKeyByValue(object, value) {
  return Object.keys(object).find((key) => object[key] === value);
}

function namesArr(results) {
  return results.reduce((acc, r) => {
    acc[r["id"]] = r["first_name"] + " " + r["last_name"];
    return acc;
  }, {});
}

// function which prompts the user for what action they should take
function runSearch() {
  inquirer
    .prompt({
      name: "pickStep",
      type: "list",
      message: "What would you like to do?",
      choices: [
        "View All Employees",
        "View All Employees by Manager",
        "View All Employees by Department",
        "Add Employee",
        "Remove Employee",
        "Update Employee Role",
        "Update Employee Manager",
      ],
    })
    .then((optionChoice) => {
      const step = optionChoice["pickStep"];
      switch (step) {
        case "View All Employees":
          viewAllEmployees();
          break;
        case "View All Employees by Manager":
          viewAllEmployeesByManager();
          break;
        case "View All Employees by Department":
          viewAllEmployeesByDepartment();
          break;
        case "Add Employee":
          addEmployee();
          break;
        case "Remove Employee":
          removeEmployee();
          break;
        case "Update Employee Role":
          updateEmployeeRole();
          break;
        case "Update Employee Manager":
          updateEmployeeManager();
          break;
        default:
          console.log("HEY");
      }
    });
}

function viewAllEmployees() {
  connection.query("SELECT * FROM employees", function (
    error,
    results,
    fields
  ) {
    console.table(results);
    runSearch();
  });
}

function viewAllEmployeesByManager() {
  connection.query("SELECT * FROM employees", function (
    error,
    results,
    fields
  ) {
    let managerNames = namesArr(results);
    inquirer
      .prompt({
        name: "managerToView",
        type: "list",
        message: "Which manager would you like to view?",
        choices: Object.values(managerNames),
      })
      .then((managerAnswers) => {
        const managerId = getKeyByValue(
          managerNames,
          managerAnswers.managerToView
        );
        connection.query(
          `SELECT e.* FROM employees e WHERE e.manager_id = ${managerId}`,
          function (error, results, fields) {
            console.table(results);
            runSearch();
          }
        );
      });
  });
}

function viewAllEmployeesByDepartment() {
  connection.query("SELECT * FROM departments", function (
    error,
    results,
    fields
  ) {
    let deptNames = results.map((d) => d["name"]);
    inquirer
      .prompt({
        name: "departmentToView",
        type: "list",
        message: "Which department would you like to view?",
        choices: deptNames,
      })
      .then((departmentAnswers) => {
        const deptId =
          deptNames.findIndex((d) => d == departmentAnswers.departmentToView) +
          1;
        connection.query(
          `SELECT e.* FROM employees e JOIN roles r ON e.role_id = r.id WHERE r.department_id = ${deptId}`,
          function (error, results, fields) {
            console.table(results);
            runSearch();
          }
        );
      });
  });
}

function addEmployee() {
  connection.query("SELECT * FROM employees", function (
    error,
    results,
    fields
  ) {
    var names = namesArr(results);
    names = { 0: "None", ...names };
    inquirer
      .prompt([
        {
          name: "first_name",
          type: "input",
          message: "What is the employee's first name?",
        },
        {
          name: "last_name",
          type: "input",
          message: "What is the employee's last name?",
        },
        {
          name: "role",
          type: "list",
          message: "What is the employee's role?",
          choices: roleArr,
        },
        {
          name: "manager",
          type: "list",
          message: "Who is this employee's manager?",
          choices: Object.values(names),
        },
      ])
      .then((employeeAnswers) => {
        employeeAnswers["role_id"] =
          roleArr.findIndex((e) => e == employeeAnswers["role"]) + 1;
        employeeAnswers["manager_id"] = getKeyByValue(
          names,
          employeeAnswers["manager"]
        );
        connection.query(
          `INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ("${employeeAnswers["first_name"]}", "${employeeAnswers["last_name"]}", ${employeeAnswers["role_id"]}, ${employeeAnswers["manager_id"]})`
        );
        runSearch();
      });
  });
}

function removeEmployee() {
  connection.query("SELECT * FROM employees", function (
    error,
    results,
    fields
  ) {
    var names = namesArr(results);
    inquirer
      .prompt([
        {
          name: "deleteUser",
          type: "list",
          message: "What employee would you like to remove?",
          choices: Object.values(names),
        },
      ])
      .then((employeeAnswers) => {
        var nameToDelete = employeeAnswers["deleteUser"];
        var idToDelete = getKeyByValue(names, nameToDelete);
        connection.query(`DELETE FROM employees where id = ${idToDelete}`);
        runSearch();
      });
  });
}

function updateEmployeeRole() {
  connection.query("SELECT * FROM employees", function (
    error,
    results,
    fields
  ) {
    var names = namesArr(results);
    inquirer
      .prompt([
        {
          name: "updateUser",
          type: "list",
          message: "What employee would you like to update?",
          choices: Object.values(names),
        },
        {
          name: "updateRole",
          type: "list",
          message: "What should this employee's new role be?",
          choices: roleArr,
        },
      ])
      .then((employeeAnswers) => {
        var userToUpdate = employeeAnswers["updateUser"];
        var idToUpdate = getKeyByValue(names, userToUpdate);
        var roleId =
          roleArr.findIndex((e) => e == employeeAnswers["updateRole"]) + 1;
        connection.query(
          `UPDATE employees SET role_id = ${roleId} WHERE id = ${idToUpdate}`
        );
        runSearch();
      });
  });
}

function updateEmployeeManager() {
  connection.query("SELECT * FROM employees", function (
    error,
    results,
    fields
  ) {
    var names = namesArr(results);
    inquirer
      .prompt([
        {
          name: "updateUser",
          type: "list",
          message: "What employee would you like to update?",
          choices: Object.values(names),
        },
        {
          name: "updateManager",
          type: "list",
          message: "Who should this employee's new manager be?",
          choices: ["None"].concat(Object.values(names)),
        },
      ])
      .then((employeeAnswers) => {
        var userToUpdate = employeeAnswers["updateUser"];
        var idToUpdate = getKeyByValue(names, userToUpdate);
        var managerId = getKeyByValue(
          { 0: "None", ...names },
          employeeAnswers["updateManager"]
        );
        connection.query(
          `UPDATE employees SET manager_id = ${managerId} WHERE id = ${idToUpdate}`
        );
        runSearch();
      });
  });
}
