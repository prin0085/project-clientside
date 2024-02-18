import { useEffect } from 'react'
import AOS from 'aos'
function Layout() {
    useEffect(() => {
        AOS.init({
            once: true,
            disable: 'phone',
            duration: 600,
            easing: 'ease-out-sine',
        })
    })
}

export default Layout