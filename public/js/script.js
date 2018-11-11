"use strict";
jQuery(document).ready(function($){

    var previous;

    $('.searchbar').on("change paste keyup", function() {

        var word = $(this).val();

        if(word !== '' && word !== previous){
            previous = word;

            suggestion(word, 10);
        }

    });

    $(document).on('click', '.option', function(el){
        el.preventDefault();

        var id = $(this).data('id');
        var name = $(this).data('name');

        /* To avoid blank searches */
        $('.submit').prop('disabled', false);

        $('.searchbar').val(name);
        $('.value').val(id);

        $('.submit').prop('disabled', false);

        $('.autocomplete').html('');

    });

    $(document).on('click', '.submit', function(el){
        el.preventDefault();

        var id = $('.value').val();
        console.log(id);
        search(id);

    })

});

function suggestion(text, size){

    $.getJSON('/suggest/'+text+'/'+size)
        .done(function(data){
            var description = data.suggest.descriptionSuggester[0].options;
            var product_type = data.suggest.product_typeSuggester[0].options;

            $('.autocomplete a').each(function(){
                $(this).remove();
            });

            $.each(description, function(index, value){
                $('.autocomplete').append('<a class="option" href="'+ value._source.link + '" data-id="'+value._id+'" data-name="'+value._source.description+' '+value._source.product_type+'"><span class="bold">'+ value._source.description +'</span> '+ value._source.product_type +'</a>')
            });

            $.each(product_type, function(index, value){
                $('.autocomplete').append('<a class="option" href="'+ value._source.link + '" data-id="'+value._id+'" data-name="'+value._source.description+' '+value._source.product_type+'">'+value._source.description +' <span class="bold">'+ value._source.product_type +'</span></a>')
            });

        });

}

function search(id){
    $.getJSON('/stat/'+id)
        .done(function(data){
            $.each(data.hits.hits, function(index, value){
                var details = value._source;
                var availability = value._source.availability == "in stock" ? true : false;
                if (availability) {
                    $('.result').html('<div class="product"><p>Description: <span class="bold">'+details.description+ ' ' + details.product_type+'</span></p><p>Price: £<span class="bold">'+details.uk_price+'</span></p><p>'+details.link+'</span></p><p>'+details.image_link+'</p></div>')
                }
            })
        });
}