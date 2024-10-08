export default function searchParams(){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams;
}