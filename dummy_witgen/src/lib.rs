use proc_macro::TokenStream;


#[proc_macro_attribute]
pub fn witgen(_attr: TokenStream, item: TokenStream) -> TokenStream {
    item
}