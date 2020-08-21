function testfunction() {
  console.log("i am inside of any statement except the function it self")
  var a = true
  if(a == true){
    console.log("u was right, a is equals true")
    break;
    console.log('has it continued?')
  }
  console.log("i am outside of it")
}
testfunction()