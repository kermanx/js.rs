pub fn parse(source: &str) -> Result<syn::File, syn::Error> {
  syn::parse_file(source)
}
