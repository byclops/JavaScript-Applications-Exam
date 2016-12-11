const kinveyBaseUrl = "https://baas.kinvey.com/";
const kinveyAppKey = "kid_By7Twu5Qx";
const kinveyAppSecret = "0005223cf04344b6955340f11db8ad32";
const kinveyAppAuthHeaders = 
	{Authorization: `Basic ${btoa(kinveyAppKey + ":" + kinveyAppSecret)}`};

//NOTIFICATION Setup
const notification = {
    errorBox: '#errorBox',
    infoBox:'#infoBox',
    loadingBox:'#loadingBox'
}


//MENU Setup
const menuContainer = '#menu';
const menuLinks = {
    appHome: '#linkMenuAppHome',
    login: '#linkMenuLogin',
    register: '#linkMenuRegister',
    userHome: '#linkMenuUserHome',
    list:'#linkMenuMyMessages',
    listSent: '#linkMenuArchiveSent',
    create: '#linkMenuSendMessage',
    logout: '#linkMenuLogout',
    greeting: '#spanMenuLoggedInUser'
};
const menuLoggedIn = ['userHome' ,'list', 'listSent', 'create', 'logout', 'greeting'];
const menuNotLoggedIn = ['appHome', 'login', 'register'];


//VIEWS Setup
const viewIds = {
    appHome: '#viewAppHome',
    login: '#viewLogin',
    register: '#viewRegister',
    userHome: '#viewUserHome',
    list:'#viewMyMessages',
    listSent: '#viewArchiveSent',
    create: '#viewSendMessage',
    // logout: '#viewLogout'
};

//MENU ACTIONS setup
const menuAction = {
    appHome: appHomeView,
    login: loginView,
    register: registerView,
    userHome: userHomeView,
    list: myMessagesController,
    listSent: sentMessagesController,
    create: createNewMessageController,
    logout: logoutUserController
};

//BUTTON ACTIONS setup
const buttonActions = {
    '#formLogin :submit': loginUserController,
    '#formRegister :submit': registerUserController,
    '#linkUserHomeMyMessages': myMessagesController,
    '#linkUserHomeArchiveSent': sentMessagesController,
    '#linkUserHomeSendMessage': createNewMessageController,
    '#formSendMessage :submit': submitMessageController
};


//UTILS
function startApp() {
	sessionStorage.clear();

	$('section').hide();
	$('#loadingBox').hide();
	$('#errorBox').hide();
	$('#infoBox').hide();

	bindButtons();
	showHideMenuLinks();

	appHomeView();

}

function showInfo(message) {
	$(notification.infoBox).text(message);
	$(notification.infoBox).show();
	setTimeout(function() {
		$('#infoBox').fadeOut();
	}, 3000);
}

function showError(errorMsg) {
    $(notification.errorBox).text("Error: " + errorMsg);
    $(notification.errorBox).show();
}

function handleAjaxError(response) {
    let errorMsg = JSON.stringify(response);
    if (response.readyState === 0)
        errorMsg = "Cannot connect due to network error.";
    if (response.responseJSON &&
        response.responseJSON.description){
        errorMsg = response.responseJSON.description;
    }
    showError(errorMsg);
}

function saveAuthInSession(userInfo) {
    let userAuth = userInfo._kmd.authtoken;
    sessionStorage.setItem('authToken', userAuth);
    let userId = userInfo._id;
    sessionStorage.setItem('userId', userId);
    let username = userInfo.username;
    sessionStorage.setItem('username', username);
    let name = userInfo.name;
    sessionStorage.setItem('name', name);
    $('#spanMenuLoggedInUser').text(
        "Welcome, " + username + "!");
    $('#viewUserHomeHeading').text("Welcome, " + username + "!");
}

function showView(viewName) {
	// Hide all views and show the selected view only
	$('main > section').hide();
	$(viewName).show();
}

function showHideMenuLinks() {
	$(menuContainer).children().hide();
	if (sessionStorage.getItem('authToken')) {
		// The user is logged in
		for (let key of menuLoggedIn) $(menuLinks[key]).show();

	} else {
		// No user is logged in
		for (let key of menuNotLoggedIn) {
            $(menuLinks[key]).show();}
	}
}

function bindButtons(){

    //prevent the default submit action on all forms
    $(function(){
        $("form").submit(function(e) {
            e.preventDefault();
        });
    });

    //Bind the menu actions
    for (let view in menuLinks){
        $(menuLinks[view]).on("click",menuAction[view]);
    }

    //Bind the button actions
    for (let button in buttonActions){

        $(button).on("click", buttonActions[button]);
    }

	// Bind the info / error boxes: hide on click
	$(notification.infoBox +', '+notification.errorBox).click(function() {
	  $(this).fadeOut();
	});

	// Attach AJAX "loading" event listener
	$(document).on({
	  ajaxStart: function() { $(notification.loadingBox).show() },
	  ajaxStop: function() { $(notification.loadingBox).hide() }
	});
}

function getKinveyUserAuthHeaders() {
    return {'Authorization': "Kinvey " + sessionStorage.getItem('authToken')};
}

function formatDate(dateISO8601) {
    let date = new Date(dateISO8601);
    if (Number.isNaN(date.getDate()))
        return '';
    return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
        "." + date.getFullYear() + ' ' + date.getHours() + ':' +
        padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

    function padZeros(num) {
        return ('0' + num).slice(-2);
    }
}

function formatSender(name, username) {

    if (!name)
        return username;
    else
        return username + ' (' + name + ')';
}

function htmlEscape(string){
    let entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    return String(string).replace(/[&<>"'\/]/g, function (s) {
        return entityMap[s];
    });
}




//MODELS - Users

function getUsersModel(){
    return $.get({
        url: `${kinveyBaseUrl}user/${kinveyAppKey}`,
        headers: getKinveyUserAuthHeaders(),
        error: handleAjaxError
    })

}

function loginUserModel(userData){
    return $.ajax({
                method: "POST",
                url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
                headers: kinveyAppAuthHeaders,
                data: userData,
                error: handleAjaxError
            });
}

function registerUserModel(userData){
    return $.ajax({
        method: "POST",
        url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
        headers: kinveyAppAuthHeaders,
        data: userData,
        error: handleAjaxError
    });
}

function logoutUserModel(){
    return  $.ajax({
        method: 'POST',
        url: kinveyBaseUrl +"user/" + kinveyAppKey + "/_logout",
        headers: getKinveyUserAuthHeaders(),
        error: handleAjaxError
    });
}

//MODELS - Messages

function getMessagesModel(queryObject){
    return $.get({
        url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/messages?query=${JSON.stringify(queryObject)}`,
        headers: getKinveyUserAuthHeaders(),
        error: handleAjaxError
    })
}

function sendMessageModel(messageData){
    return $.ajax({
        method: 'POST',
        url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/messages`,
        headers: getKinveyUserAuthHeaders(),
        // data: JSON.stringify(messageData),
        data:messageData,
        error: handleAjaxError
    })
}

function deleteMessageModel(messageId){
    return $.ajax({
        method: 'DELETE',
        url: `${kinveyBaseUrl}appdata/${kinveyAppKey}/messages/${messageId}`,
        headers: getKinveyUserAuthHeaders(),
        error: handleAjaxError
    })
}


//VIEWS

function appHomeView(){
    showView(viewIds.appHome);
}

function loginView(){
    showView(viewIds.login);
}

function registerView(){
    showView(viewIds.register);
}

function userHomeView(){
    showView(viewIds.userHome);
}

function myMessagesView(messages){
    $('#viewMyMessages #myMessages table tbody').empty();
    for (let message of messages){
        $('#viewMyMessages #myMessages table tbody')
            .append(createMessageRow(message))
    }

    showView(viewIds.list);

    function createMessageRow(message){
        let result = $(`
            <tr>
                <td>${formatSender(message.sender_name, message.sender_username)}</td>
                <td>${htmlEscape(message.text)}</td>
                <td>${formatDate(message._kmd.lmt)  }</td>
            </tr>
        `);
        return result
    }
}

function sentMessagesView(messages){
    $('#viewArchiveSent #sentMessages table tbody').empty();
    for (let message of messages){
        $('#viewArchiveSent #sentMessages table tbody')
            .append(createSentMessageRow(message))
    }

    showView(viewIds.listSent);

    function createSentMessageRow(message){
        let result = $(`
            <tr>
                <td>${message.recipient_username}</td>
                <td>${htmlEscape(message.text)}</td>
                <td>${formatDate(message._kmd.lmt)}</td>
                <td><button>Delete</button></td>
            </tr>
        `);
        result.find('button').on("click", deleteMessageController.bind(deleteMessageController,message._id));
        return result;
    }
}

function sendMessageView(){
    showView(viewIds.create);
}



//CONTROLLERS - USER

function registerUserController() {

    let userData = {
        username: $('#formRegister input[name=username]').val(),
        password: $('#formRegister input[name=password]').val(),
        name: $('#formRegister input[name=name]').val()
    };

    registerUserModel(userData).then(function(userInfo) {
        saveAuthInSession(userInfo);
        showHideMenuLinks();
        userHomeView();
        showInfo('User registration successful.');
        $(viewIds.register).trigger('reset');
    });
}

function loginUserController(){
    let userData = {
        username: $('#formLogin input[name=username]').val(),
        password: $('#formLogin input[name=password]').val()
    };

    // console.log(userData);

    loginUserModel(userData)
        .then( function (userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            userHomeView();
            showInfo('Login successful.');
            $('#formLogin').trigger('reset');
        });
}

function logoutUserController(){
    logoutUserModel().then(function(){
        sessionStorage.clear();
        $('#spanMenuLoggedInUser').text("");
        showHideMenuLinks();
        appHomeView();
        showInfo('Logout successful.');
    });
}


//CONTROLLERS - Messages
function myMessagesController(){
    let query = {recipient_username:sessionStorage.getItem('username')};
    getMessagesModel(query).then(myMessagesView);
}

function sentMessagesController(){
    let query = {sender_username:sessionStorage.getItem('username')};
    getMessagesModel(query).then(sentMessagesView)
}

function createNewMessageController(){
    getUsersModel().then(function(users){
        $('#viewSendMessage #formSendMessage #msgRecipientUsername').empty();
        for (let user of users){
            $('#viewSendMessage #formSendMessage #msgRecipientUsername')
                .append($(`
                    <option value="${user.username}">${formatSender(user.name, user.username)}</option>
                `));
        }

        sendMessageView();
    })
}

function submitMessageController() {
    let message = {
        recipient_username: $('#viewSendMessage #formSendMessage #msgRecipientUsername').val(),
        sender_username: sessionStorage.getItem('username'),
        sender_name: sessionStorage.getItem('name'),
        text: $('#viewSendMessage #formSendMessage #msgText').val()

    }

    if (message.sender_name =='undefined') message.sender_name = null;

    sendMessageModel(message).then(function(){
        sentMessagesController();
        showInfo('Message sent.');
        $('#viewSendMessage #formSendMessage').trigger('reset');
    })
}

function deleteMessageController(messageId){
    deleteMessageModel(messageId)
        .then(function(){
            sentMessagesController();
            showInfo('Message deleted.');
        })

}
