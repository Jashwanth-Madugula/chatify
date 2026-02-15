import React,{useState} from 'react'
import assets from '../assets/assets'

const LoginPage = () => {

  const [currState, setCurrState] = useState("Sign Up") // login or register
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [bio, setBio] = useState("")
  const [isDataSubmitted, setIsDataSubmitted] = useState(false)

  const onSubmitHandler = (e) => {
    e.preventDefault()    
    if(currState === "Sign Up" && !isDataSubmitted) {
      setIsDataSubmitted(true)
      return
    }
  }

  return (
    <div>
      <div className='min-h-screen bg-cover bg-center flex items-center justify-center
       gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl'>
        {/* left part */}
        <img src={assets.logo_big} alt="login" className='w-[min(30vw,250px)]' />
        {/* right part */}

        <form onSubmit={onSubmitHandler}
        action="" className='border-2 bg-white/8 text-white border-gray-500 p-6 
        flex flex-col gap-6 rounded-lg shadow-lg'>
            <h2 className='font-medium text-2xl flex justify-between items-center'>
              {currState}
              <img src={assets.arrow_icon} alt="arrow" className='w-5 h-5 cursor-pointer' />
              </h2>

            {currState === "Sign Up" && !isDataSubmitted && <input type="text" placeholder='Full Name'
             className='bg-[#282142]/60 text-sm text-white p-3 rounded-lg' required onChange={(e) => setFullName(e.target.value)} value={fullName}/>}
            <input type="email" placeholder='Email Address' value={email}
            className='bg-[#282142]/60 text-sm text-white p-3 rounded-lg' required onChange={(e) => setEmail(e.target.value)}/>
            <input type="password" placeholder='Password' value={password}
            className='bg-[#282142]/60 text-sm text-white p-3 rounded-lg' required onChange={(e) => setPassword(e.target.value)}/>
            <button className='bg-[#ff5d5d] hover:bg-[#ff5d5d]/80 text-white py-3 px-6 rounded-lg font-medium'>
              {currState === "Sign Up" ? "Create Account" : "Login"}
            </button>

            {currState === "Sign Up" && isDataSubmitted && (
              <textarea placeholder='Short Bio' value={bio} rows={4}
            className='bg-[#282142]/60 text-sm text-white p-3 rounded-lg' onChange={(e) => setBio(e.target.value)} required/>)}

            <div className='flex items-center gap-2 text-sm text-gray-500'>
              <input type="checkbox" />
              <p>Agree to Terms and Conditions</p>
            </div>

            <div>
              {currState === "Sign Up" ? (
                <p className='text-sm'>Already have an account? <span className='text-[#ff5d5d] cursor-pointer' onClick={() => setCurrState("Login")}>Login</span></p>
              ) : (
                <p className='text-sm'>Don't have an account? <span className='text-[#ff5d5d] cursor-pointer' onClick={() => setCurrState("Sign Up")}>Sign Up</span></p>
              )}
            </div>
        </form>
      
      </div>
    </div>
  )
}

export default LoginPage
