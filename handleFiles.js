function handleFile(event) {
    let input = event.target;
    console.log(input.files[0]);
    let reader = new FileReader();
    console.log("loaded");
    reader.onload = (function(){
        //console.log(reader.result);
        //let newMap = reader.readAsDataURL(input.files[0]);
        //stateUserFile = true;
        //changeMap(newMap);
        console.log("here");
    })();
    let newMap = reader.readAsDataURL(input.files[0]);
    changeMap(newMap);
}