function startApp() {
	
	if (sessionStorage.getItem('authToken') !== null) {
        let username = sessionStorage.getItem('username');
        $('#loggedInUser').text("Welcome, " + username + "!");
    }
    showHideMenuLinks();
    showHomeView();


    // Bind the navigation menu links
    $("#linkHome").click(showHomeView);
    $("#linkLogin").click(showLoginView);
    $("#linkRegister").click(showRegisterView);
    $("#linkListAds").click(listAdverts);
    $("#linkCreateAd").click(showCreateAdView);
    $("#linkLogout").click(logoutUser);

    // Bind the form submit buttons
    $("#buttonLoginUser").click(loginUser);
    $("#buttonRegisterUser").click(registerUser);
    $("#buttonCreateAd").click(createAdvert);
    $("#buttonEditAd").click(editAdvert);
	
	  // Bind the info / error boxes
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });


    const kinveyBaseUrl = "https://mock.api.com/";
    const kinveyAppKey = "kid_rk";
    const kinveyAppSecret = "736804a668";


    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }
         $("#linkLogout").show();
        }
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON && response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }
    function showHomeView() {
        showView('viewHome');
    }

    function showHideMenuLinks() {
        $("#linkHome").show();
        if (sessionStorage.getItem('authToken') === null) {
            // No logged in user
            $("#linkLogin").show();
            $("#linkRegister").show();
            $("#linkListAds").hide();
            $("#linkCreateAd").hide();
            $("#linkLogout").hide();
			$("#loggedInUser").hide();
        } else {
            // We have logged in user
            $("#linkLogin").hide();
            $("#linkRegister").hide();
            $("#linkListAds").show();
            $("#linkCreateAd").show();
            $("#linkLogout").show();
			$("#loggedInUser").show();
        }
    }

    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }

    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function showCreateAdView() {
        $('#formCreateAd').trigger('reset');
        showView('viewCreateAd');
    }


    // user/login
    function loginUser() {
        const kinveyLoginUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/login";
        const kinveyAuthHeaders = {
            'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret),
        };
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=passwd]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyLoginUrl,
            headers: kinveyAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError

        });

        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listAdverts();
			showInfo('Login successful.');
        }
    }

    function saveAuthInSession(userInfo) {
        let userAuth = userInfo._kmd.authtoken;
        sessionStorage.setItem('authToken', userAuth);
        let userId = userInfo._id;
        sessionStorage.setItem('userId', userId);
		let username = userInfo.username;
        sessionStorage.setItem('username', username);
        $('#loggedInUser').text("Welcome, " + username + "!");
    }

    // user/register
    function registerUser() {
        const kinveyRegisterUrl = kinveyBaseUrl + "user/" + kinveyAppKey + "/";
        const kinveyAuthHeaders = {
            'Authorization': "Basic " + btoa(kinveyAppKey + ":" + kinveyAppSecret),
        };

        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=passwd]').val()
        };

        $.ajax({
            method: "POST",
            url: kinveyRegisterUrl,
            headers: kinveyAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError

        });

        function registerSuccess(userInfo) {
            console.log(userInfo);
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listAdverts();
			 showInfo('User registration successful.');

        }
    }

    // user/logout
    function logoutUser() {
        sessionStorage.clear();
        $('#loggedInUser').text("");
        showHideMenuLinks();
        showHomeView();
		showInfo('Logout successful.');
    }

    // advertisement/all
    function listAdverts() {
        $('#ads').empty();
        showView('viewAds');

        const kinveyAdvertsUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/adverts";
        const kinveyAuthHeaders = {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };
        $.ajax({
            method: "GET",
            url: kinveyAdvertsUrl,
            headers: kinveyAuthHeaders,
            success: loadAdvertsSuccess,
		    error: handleAjaxError

        });

        function loadAdvertsSuccess(adverts) {
			showInfo('Advertisements loaded.');
            if (adverts.length === 0) {
                $('#ads').text('No advertisements available.');
            } else {
                let advertsTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>Title</th>',
						'<th>Description</th>',
                        '<th>Publisher</th>',
                        '<th>Date Published</th>',
                        '<th>Price</th>'),
						'<th>Actions</th>')

                    );

                for (let advert of adverts) {
		    let links = [];

                    if (advert._acl.creator == sessionStorage['userId']) {
                        let deleteLink = $(`<a data-id="${advert._id}" href="#">[Delete]</a>`)
                            .click(function() { deleteAdvert($(this).attr("data-id")) });
                        let editLink = $(`<a data-id="${advert._id}" href="#">[Edit]</a>`)
                            .click(function() { loadAdvertForEdit($(this).attr("data-id")) });
                        links = [deleteLink, ' ', editLink];
                    }

					     let readMoreLink = $(`<a data-id="${advert._id}" href="#">[Read More]</a>`)
                        .click(function() { displayAdvert($(this).attr("data-id")) });

                    advertsTable.append($('<tr>').append(
                        $('<td>').text(advert.title),
						$('<td>').text(advert.description),
                        $('<td>').text(advert.publisher),
                        $('<td>').text(advert.datePublished),
                        $('<td>').text(advert.price), 
                        $('<td>').append(readMoreLink),
						$('<td>').append(links)
                    ));
                }

                $('#ads').append(advertsTable);
            }
        }
    }

// advertisement/create
    function createAdvert() {
        const kinveyAuthHeaders = {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };

        const kinveyUserUrl =
            `${kinveyBaseUrl}user/${kinveyAppKey}/${sessionStorage.getItem('userId')}`;

        $.ajax({
            method: "GET",
            url: kinveyUserUrl,
            headers: kinveyAuthHeaders,
            success: afterPublisherRequest,
            error: showError

        });

        function afterPublisherRequest(publisher) {
            let advertData = {
                title: $('#formCreateAd input[name=title]').val(),
				description: $('#formCreateAd textarea[name=description]').val(),
                publisher: publisher.username,
                datePublished: $('#formCreateAd input[name=datePublished]').val(),
                price: Number($('#formCreateAd input[name=price]').val()),
				image: $('#formCreateAd input[name=image]').val()
            };

            const kinveyAdvertsUrl = kinveyBaseUrl + "appdata/" + kinveyAppKey + "/adverts";
            $.ajax({
                method: "POST",
                url: kinveyAdvertsUrl,
                headers: kinveyAuthHeaders,
                data: advertData,
                success: createAdvertSuccess
            });

            function createAdvertSuccess(response) {
                listAdverts();
            }
        }
    }

    // advertisement/delete
    function deleteAdvert(advertId) {
        const kinveyBookUrl = kinveyBaseUrl + "appdata/" +
            kinveyAppKey + "/adverts/" + advertId;
        const kinveyAuthHeaders = {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };

        $.ajax({
            method: "DELETE",
            url: kinveyBookUrl,
            headers: kinveyAuthHeaders,
            success: deleteBookSuccess,
            error: handleAjaxError

        });

        function deleteBookSuccess(response) {
            listAdverts();
            showInfo('Advert deleted.');
        }
    }

    // advertisement/edit GET
    function loadAdvertForEdit(advertId) {
        const kinveyBookUrl = kinveyBaseUrl + "appdata/" +
            kinveyAppKey + "/adverts/" + advertId;
        const kinveyAuthHeaders = {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };

        $.ajax({
            method: "GET",
            url: kinveyBookUrl,
            headers: kinveyAuthHeaders,
            success: loadAdvertForEditSuccess,
            error: handleAjaxError

        });

        function loadAdvertForEditSuccess(advert) {
            $('#formEditAd input[name=id]').val(advert._id);
            $('#formEditAd input[name=title]').val(advert.title);
            $('#formEditAd input[name=publisher]').val(advert.publisher);
			$('#formEditAd textarea[name=description]').val(advert.description);
            $('#formEditAd input[name=datePublished]').val(advert.datePublished);
            $('#formEditAd input[name=price]').val(advert.price);
			$('#formEditAd input[name=image]').val(advert.image);
            showView('viewEditAd');
        }
    }

	function displayAdvert(advertId){
        const kinveyAdvertUrl = kinveyBaseUrl + "appdata/" +
            kinveyAppKey + "/adverts/" + advertId;
        const kinveyAuthHeaders = {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };

        $.ajax({
            method: "GET",
            url: kinveyAdvertUrl,
            headers: kinveyAuthHeaders,
            success: displayAdvertSuccess
			error: handleAjaxError
        });

        $('#viewDetailsAd').empty();

        function displayAdvertSuccess(advert) {
            let advertInfo = $('<div>').append(
                $('<img>').attr("src", advert.image),
                $('<br>'),
                $('<label>').text('Title:'),
                $('<h1>').text(advert.title),
                $('<label>').text('Description:'),
                $('<p>').text(advert.description),
                $('<label>').text('Publisher:'),
                $('<div>').text(advert.publisher),
                $('<label>').text('Date:'),
                $('<div>').text(advert.datePublished));

            $('#viewDetailsAd').append(advertInfo);

            showView('viewDetailsAd');
        }
    }
	
	    // advertisement/edit POST
    function editAdvert() {
        const kinveyAdvertUrl =  kinveyBaseUrl + "appdata/" + kinveyAppKey +
            "/adverts/" + $('#formEditAd input[name=id]').val();
        const kinveyAuthHeaders = {
            'Authorization': "Kinvey " + sessionStorage.getItem('authToken'),
        };

        let advertData = {
            title: $('#formEditAd input[name=title]').val(),
			description: $('#formEditAd textarea[name=description]').val(),
            publisher: $('#formEditAd input[name=publisher]').val(),
            datePublished: $('#formEditAd input[name=datePublished]').val(),
            price: $('#formEditAd input[name=price]').val(),
			image: $('#formEditAd input[name=image]').val()
        };

        $.ajax({
            method: "PUT",
            url: kinveyAdvertUrl,
            headers: kinveyAuthHeaders,
            data: advertData,
            success: editAdvertSuccess,
            error: handleAjaxError

        });

        function editAdvertSuccess(response) {
            listAdverts();
            showInfo('Advertisement created.');
        }
    }

}


