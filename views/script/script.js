
  const btn = document.getElementById('btn-submit')
  const qry = `{
                getAllUsers(page_size:10,page_index:1,string_to_search:"renaldo"){
                    status
                    error 
                    list_data
                    {
                        full_name
                        username
                    }
                }
            }`
  const payload = { query: qry }
  btn.addEventListener('click', async () => {
    const data = await fetch('http://localhost:3000/graphql',
      {
        method: 'GET', // or 'PUT'
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(e => e.json() || [])
    console.log('data>>>>', data)
  })

