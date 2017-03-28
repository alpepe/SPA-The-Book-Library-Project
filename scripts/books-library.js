function startApp() {
    sessionStorage.clear();
    showHideMenuLinks();
    showView('viewHome');
    
    // Bind the navigation menu links
    $("#linkHome").click(showHomeView);
    $("#linkLogin").click(showLoginView);
    $("#linkRegister").click(showRegisterView);
    $("#linkListBooks").click(listBooks);
    $("#linkCreateBook").click(showCreateBookView);
    $("#linkLogout").click(logoutUser);


    // Bind the form submit buttons
    $("#formLogin").submit(loginUser);          //submit on form !!
    $("#formRegister").submit(registerUser);  //submit on form !!
    $("#buttonCreateBook").click(createBook);
    $("#buttonEditBook").click(editBook);


    // Bind the info / error boxes: hide on click
    $("#infoBox, #errorBox").click(function() {
        $(this).fadeOut();
    });

    // Attach AJAX "loading" event listener
    $(document).on({
        ajaxStart: function() { $("#loadingBox").show() },
        ajaxStop: function() { $("#loadingBox").hide() }
    });

    const kinveyBaseUrl = "https://baas.kinvey.com/";
    const kinveyAppKey = "kid_ryV04Puze";
    const kinveyAppSecret =
        "9ba1923fe1834bd2a961cd42773c7094";
    const kinveyAppAuthHeaders = {
        'Authorization': "Basic " +
        btoa(kinveyAppKey + ":" + kinveyAppSecret),
    };




    function showHideMenuLinks() {
        $("#menu a").hide();
        if(sessionStorage.getItem("authToken")){
            //loget in user
            $("#linkHome").show();
            $("#linkListBooks").show();
            $("#linkCreateBook").show();
            $("#linkLogout").show();
        }
        else {
            //No user logget in
            $("#linkHome").show();
            $("#linkLogin").show();
            $("#linkRegister").show();
        }

    }
    function showView(viewName) {
        // Hide all views and show the selected view only
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showHomeView() {
        showView("viewHome")
    }
    function showLoginView() {
        showView("viewLogin");
        $("#formLogin").trigger('reset')
    }
    function showRegisterView() {
        showView("viewRegister")
    }
    function listBooks() {
        $('#books').empty();
        showView('viewBooks');
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books",
            headers: getKinveyUserAuthHeaders(),
            success: loadBooksSuccess,
            error: handleAjaxError
        });
        function loadBooksSuccess(books) {
            let table=$(`<table>
                            <tr>
                                <th>Title</th>
                                <th>Author</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr></table>`);
            for(let book of books){
                let link=[];
                let deleteLink = $("<a href='#'>[Delete]</a>").click(function () {
                    deleteBookById(book._id)
                })
                let editLink = $("<a href='#'>[Edit]</a>").click(function () {
                    loadBookForEdit(book._id)
                })
                link.push(deleteLink)
                link.push(" ")
                link.push(editLink)
                let tr = $("<tr>");
                tr.append(`<td>${book.title}</td>`).append(`<td>${book.author}</td>`).append(`<td>${book.description}</td>`);
                let tdLinks = $("<td>")
                tr.append(tdLinks)
                if(book._acl.creator == sessionStorage.getItem("userId")) {   //book._acl.creator това е Ид-то на усера, койтое създал книгата
                    tdLinks.append(deleteLink).append(" ").append(editLink);  //ако този узер е създал книгата, само той може да ятриеили променя
                }

                table.append(tr)
            }
            $("#books").append(table)
        }

    }
    function deleteBookById(bookId) {
        $.ajax({
            method: "DELETE",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books/"+ bookId,
            headers: getKinveyUserAuthHeaders(),
            success: deleteBooksSuccess,
            error: handleAjaxError
        });
        function deleteBooksSuccess() {
            showInfo("Book deleted");
            listBooks();
        }
    }
    function getKinveyUserAuthHeaders() {
        return{
            "Authorization" : "Kinvey " +sessionStorage.getItem("authToken")
        }
    }
    function showCreateBookView() {
        $('#formCreateBook').trigger('reset');
        showView('viewCreateBook');

    }
    function logoutUser() {
        sessionStorage.clear()
        $("#loggedInUser").text("");
        showHomeView()
        showHideMenuLinks();
        showInfo('User logout successful.');
    }
    function loginUser(event) {
        event.preventDefault();
        let userData = {
            username: $('#formLogin input[name=username]').val(),
            password: $('#formLogin input[name=passwd]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });
        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('User Login successful.');

        }
    }
    function registerUser(event) {
        event.preventDefault();               //задължително е за да работи регистрацията !!!!
        let userData = {
            username: $('#formRegister input[name=username]').val(),
            password: $('#formRegister input[name=passwd]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppKey + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });

        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            listBooks();
            showInfo('User registration successful.');

        }

    }
    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function() {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function saveAuthInSession(userInfo) {
        sessionStorage.setItem("username", userInfo.username);
        sessionStorage.setItem("authToken", userInfo._kmd.authtoken);
        sessionStorage.setItem("userId", userInfo._id);
        $('#loggedInUser').text(
            "Welcome, " + userInfo.username + "!");
    }
    function handleAjaxError(response) {
        let errorMsg = JSON.stringify(response);
        if (response.readyState === 0)
            errorMsg = "Cannot connect due to network error.";
        if (response.responseJSON &&
            response.responseJSON.description)
            errorMsg = response.responseJSON.description;
        showError(errorMsg);
    }
    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function createBook() {
        let bookData = {
            title: $('#formCreateBook input[name=title]').val(),
            author: $('#formCreateBook input[name=author]').val(),
            description: $('#formCreateBook textarea[name=descr]').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppKey + "/books",
            headers: getKinveyUserAuthHeaders(),
            data : bookData,
            success: createBooksSuccess,
            error: handleAjaxError
        });
        function createBooksSuccess() {
            showInfo("Book created");
            listBooks()
        }
    }
    function editBook() {
            let bookData = {
                title: $('#formEditBook input[name=title]').val(),
                author: $('#formEditBook input[name=author]').val(),
                description:
                    $('#formEditBook textarea[name=descr]').val()
            };
            $.ajax({
                method: "PUT",
                url: kinveyBaseUrl + "appdata/" + kinveyAppKey +
                "/books/" + $('#formEditBook input[name=id]').val(),
                headers: getKinveyUserAuthHeaders(),
                data: bookData,
                success: editBookSuccess,
                error: handleAjaxError
            });

            function editBookSuccess(response) {
                listBooks();
                showInfo('Book edited.');
            }

    }
    function loadBookForEdit(book) {
        $.ajax({
            method: "GET",
            url: kinveyBookUrl = kinveyBaseUrl + "appdata/" +
                kinveyAppKey + "/books/" + book,
            headers: getKinveyUserAuthHeaders(),
            success: loadBookForEditSuccess,
            error: handleAjaxError
        });
        function loadBookForEditSuccess(book) {
            $('#formEditBook input[name=id]').val(book._id);
            $('#formEditBook input[name=title]').val(book.title);
            $('#formEditBook input[name=author]')
                .val(book.author);
            $('#formEditBook textarea[name=descr]')
                .val(book.description);
            showView('viewEditBook');
        }
    }



    }

