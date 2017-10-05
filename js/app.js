document.addEventListener("DOMContentLoaded", function(event) {
	// on load, request location and set map to users location
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(setMap);
	}
	else {
		alert('Geolocation not available.');
	}
	
	// set map width
	$('#control').width($('#control-col').width());

	// set up datepicker
	$('#date').datepicker({
		format: "yyyy-mm",
		startView: 1,
		minViewMode: 1,
		maxViewMode: 2,
		todayBtn: "linked",
		autoclose: true
	});

	// this is required to force a vertical scrollbar on load
	$('#container').css('position', 'fixed');
});

// on window resize, resize map element
$(window).resize(function() {
	$('#control').width($('#control-col').width());
});

// on scroll, change scroll indicator bar
$(window).scroll(function() {
	var scrollPercent = 100 * $(window).scrollTop() / ($(document).height() - $(window).height());
	$('.bar-long').css('width', scrollPercent +"%");
});

// function to set the locationpicker map to the users current location
function setMap(position) {
	$('#map').locationpicker({
		location: {
			latitude: position.coords.latitude,
			longitude: position.coords.longitude
		},
		radius: 1610,
		zoom: 13
	});
}

// helper function to replace dashes with spaces
function reformat(str) {
	return str.split('-').join(' ');
}

last_result = [];

// on find button clicked
$('#go').click(function() {
	// get required values
	var lat = $('#map').locationpicker('location').latitude;
	var lng = $('#map').locationpicker('location').longitude;
	var date = $('#date').val();

	// reset scroll indicator and results list
	$('.bar-long').css('width', 0);
	$('#res').empty();

	// set GET request data
	if (date != "") {
		data = {
			lat: lat,
			lng: lng,
			date: date
		}
	}
	else {
		data = {
			lat: lat,
			lng: lng
		}
	}

	// perform GET request
	$.get('https://data.police.uk/api/crimes-street/all-crime', data, function(result) {
		if (result.length == 0){
			$('#res').append($('<li class="list-group-item">No results found</li>'))
		}
		last_result = result;
		$.each(result, function(id, crime) {
			$('#res').append($('<a href="javascript:void(0)" class="list-group-item list-group-item-action flex-column align-items-start"> \
									<div class="d-flex w-100 justify-content-between"> \
										<h5 class="mb-1">' + reformat(crime.category) + '</h5> \
										<small id="id">' + crime.id + '</small><small>' + crime.month + '</small> \
									</div> \
									<p class="mb-1">' + crime.location.street.name + '</p> \
									<small>' + crime.location.latitude + ', ' + crime.location.longitude + '</small> \
								</a>'));
		});
	}, 'json')
	.fail(function() {
		$('#res').append($('<li class="list-group-item">500 (INTERNAL SERVER ERROR) - this usually means no data available</li>'))
	});
});

$('body').on("click", '.list-group-item', function() {
	var crime_id = $(this).find('#id')[0].innerText;
	$.each(last_result, function(id, crime) {
		if (crime.id == crime_id) {
			$('#crime-display-title').text(reformat(crime.category));
			mmap = new GMaps({
				div: '#modal-map',
				lat: crime.location.latitude,
				lng: crime.location.longitude,
				zoom: 13,
				width: '100%',
				height: '300px'
			});
			mmap.addMarker({
				lat: crime.location.latitude,
				lng: crime.location.longitude
			});
			setTimeout(function(){mmap.setCenter(crime.location.latitude, crime.location.longitude, null)}, 600);

			if (crime.outcome_status != null) {
				$('#outcome-text').text('Outcome: ' + crime.outcome_status.category);
			}
			else {
				$('#outcome-text').text('Outcome: not available.');
			}
		}
	});
	$('#crime-modal').modal('toggle');
	setTimeout(function(){mmap.refresh();}, 500);
});