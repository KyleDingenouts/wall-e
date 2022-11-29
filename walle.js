// Pak de template content vanuit de HTML
var template = document.getElementById("slidetemplate").innerHTML;
 
// Compile het template met Template7 library
var compiledTemplate = Template7.compile(template);

// Transformeer een string naar een kleur, zodat iedere commissie zn eigen kleur heeft
var stringToColour = function(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    var colour = '#';
    for (var i = 0; i < 3; i++) {
        var value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
    }
    return colour;
}

// Functie laad de data van de api en zorgt voor het renderen van de slideshow
async function load() {
    // Endpoint for pull
    let url = fetch_api_url;
    let context = null;
    
    try {
        context = await (await fetch(url)).json();
    } catch(e) {
        console.log('Error: cannot fetch from API on ' + url);
    }

    // Als goede API results worden teruggestuurd, maak de slideshow
    if(context != null){
        // Add a color to a certain cie
        context.cies.forEach(element => {
            element.ciecolor = stringToColour(element.cienaam)
        });

        spliced_context = { cies: [] }
        split_on_n = max_aantal_fotos_op_slide
        // Split bepaalde cies in meerdere slides als er meer dan 12 leden zijn
        for(var i = 0; i < context.cies.length; i++){
            var current_cie = context.cies[i]
            var ccl_length = current_cie.cieleden.length
            
            // Als de cie geen leden bevat, laten we m niet zien
            if(ccl_length == 0) {
                continue;
            }
            // Als de cie 12 of minder leden heeft, kopieren we deze cie simpelweg
            else if(ccl_length <= split_on_n) {
                spliced_context.cies.push(current_cie)
            }
            // Als er meer dan 12 leden in de cie zijn, maak meerdere subcies aan voor slideshow e.g. SpoCie 1/2 en SpoCie 2/2
            else if (ccl_length > split_on_n) {

                // Hoeveel slides nodig?
                slides_needed = Math.floor(ccl_length / split_on_n) + 1
                if(ccl_length % split_on_n == 0) slides_needed = Math.floor(ccl_length / split_on_n)
                // Hoeveel fotos per slide
                img_per_slide = Math.floor(ccl_length / slides_needed)
                // Als geen perfecte deler, hoeveel houden we nog over?
                img_remaining = ccl_length % slides_needed

                // Add subslides
                for(var j = 0; j < slides_needed; j++) {

                    // Deep clone de cie 
                    subcie = {...current_cie}

                    // Hernoem de cie naar naam + (x/n)
                    subcie.cienaam = subcie.cienaam + " (" + (j+1) + "/" + slides_needed + ")"

                    // First slide, add remainers
                    if(j == 0) {
                        subcie.cieleden = subcie.cieleden.slice(0,img_per_slide + img_remaining)
                    }
                    else {
                        subcie.cieleden = subcie.cieleden.slice(j*img_per_slide + img_remaining,(j+1)*img_per_slide + img_remaining)
                    }
                    spliced_context.cies.push(subcie)
                }
            }
        }

        // Use context variables to render template
        var html = compiledTemplate(spliced_context);

        // Set content of slideshow
        document.getElementById("set-content").innerHTML = html

    } else {
        // Toon error pagina, deze is moeilijk cute.
        document.getElementById("set-content").innerHTML = '<section><img src="walle.png" width="100px" /><h4>Oeps :(</h4><h5>Er ging iets fout tijdens het laden van Wall-E</h5></section>'
    }

    // Initialize content as an actual slideshow
    Reveal.initialize({
        autoSlide: slide_show_n_seconds * 1000,
        loop: true,
        autoSlideStoppable: false,
        controls: false,
        progress: false
    });
}

// Inital load
load();

// Reload every 2 hours
setInterval(load, 1000 * 60 * 60 * refresh_every_n_hours)
